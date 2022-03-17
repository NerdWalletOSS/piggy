import Foundation
import React
import Starscream

private enum Constants {
    static let DefaultPriority: Double = 1000.0
    static let MaxPendingEvents = 250

    enum Url {
        static let DefaultHostname = "localhost:8347"
    }

    enum TcpOverUsbPorts {
        static let Debug = [
            UInt(8081): UInt(9081),     /* bundler */
            UInt(8082): UInt(9082),     /* bundler */
            UInt(8347): UInt(9347),     /* piggy */
            UInt(17321): UInt(18321)    /* query0 */
        ]
        static let Beta = [
            UInt(8347): UInt(9347)      /* piggy */
        ]
        static let Production: [UInt: UInt] = [:]
    }

    enum Key {
        /* config */
        static let Prefix = "timeliner"
        static let Hostname = "hostname"
        static let SessionId = "sessionId"
        static let Enabled = "enabled"
        static let ForceEnabled = "forceEnabled"
        static let DeviceId = "deviceId"

        /* data */
        static let Context = "context"
        static let Checkpoints = "checkpoints"
        static let Data = "data"
        static let End = "end"
        static let Id = "id"
        static let Name = "name"
        static let Priority = "priority"
        static let Start = "start"
        static let Time = "time"
        static let WorkUnits = "workUnits"
        static let LogType = "type"
        static let Level = "level"
        static let Tag = "tag"
        static let Timestamp = "timestamp"
        static let Arguments = "arguments"

        /* stopwatch options */
        static let ColorHint = "colorHint"
    }

    enum EventLogType {
        static let Console = "console"
    }

    enum Message {
        static let TimelineSend = "/timeline/send"
        static let EventLogSend = "/eventLog/send"
    }
}

public extension Date {
    static func now() -> Int64 {
        return Int64(NSDate().timeIntervalSince1970 * 1000)
    }
}

/* yikes, OSAtomicIncrement32() and friends are deprecated and Swift doesn't seem to provide
 any sort of AtomicInteger-like class. this is a small wrapper class around a semaphore and
 raw integer, found here: https://gist.github.com/nestserau/ce8f5e5d3f68781732374f7b1c352a5a */
public final class AtomicInteger {
    private let _lock = DispatchSemaphore(value: 1)
    private var _value: Int

    public init(value initialValue: Int = 0) {
        _value = initialValue
    }

    public var value: Int {
        get {
            _lock.wait()
            defer { _lock.signal() }
            return _value
        }
        set {
            _lock.wait()
            defer { _lock.signal() }
            _value = newValue
        }
    }

    public func decrement() {
        _lock.wait()
        defer { _lock.signal() }
        _value -= 1
    }

    public func increment() {
        _lock.wait()
        defer { _lock.signal() }
        _value += 1
    }
}

public class Piggy: NSObject {
    // MARK: - Singleton

    @objc public static let instance = Piggy()

    // MARK: - Public Constants

    @objc public static let AppStartedEvent = "NWAppStartedEvent"
    @objc public static let defaultStopwatchContext = ["type": "active"];

    @objc
    public enum BuildType: Int, RawRepresentable {
        case Beta
        case Debug
        case Production

        public typealias RawValue = String

        public var rawValue: RawValue {
            switch self {
            case .Beta: return "Beta"
            case .Debug: return "Debug"
            case .Production: return "Production"
            }
        }

        public init?(rawValue: RawValue) {
            switch rawValue {
            case "Beta": self = .Beta
            case "Debug": self = .Debug
            case "Production": self = .Production
            default: self = .Production
            }
        }
    }

    public struct ColorHint {
        public static let WHITE = "white"
        public static let BLUE = "blue"
        public static let GREEN = "green"
        public static let YELLOW = "yellow"
        public static let CYAN = "cyan"
        public static let MAGENTA = "magenta"
        public static let RED = "red"
    }

    // MARK: - Properties

    private var stopwatchOptions = [String:[String:Any]]()
    private var activeStopwatches = [Stopwatch]()
    private var pendingStopwatches = [Stopwatch]()
    private var events: [[String:Any]] = Array()
    private let dispatchQueue = DispatchQueue(label: "com.nerdwallet.piggy.queue")
    private var hostnameOverride: String?
    private let prefs = UserDefaults.standard
    private var sessionId: Int64 = 0
    private var uniqueId = AtomicInteger()
    private var webSocket: WebSocket?
    private var nameToPriority = [String: Double]()
    private var buildType = BuildType.Production
    private var enabledByDefault = false
    private var forceEnabled = false
    private let fallbackDeviceId = UUID().uuidString
    private var enableBridgeForwarding = false
    private var forwardedPorts = [FBPortForwardingServer]()

    private var deviceId: String {
        // Using a computed property because If the value is nil we need to wait and get the value again later.
        // This happens, for example, after the device has been restarted but before the user has unlocked the device
        if let id =
            UIDevice
                .current
                .identifierForVendor?
                .uuidString
                .addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
            return id
        }

        return fallbackDeviceId
    }

    public func setForceEnabled(_ enabled: Bool) {
        if buildType != BuildType.Production {
            self.forceEnabled = enabled
        } else {
            self.forceEnabled = false
        }
    }

    @objc
    public var enabled: Bool {
        /* we're always disabled for prod builds! we're disabled by default
         in BETA/ENTERPRISE builds, but the user can force us on via DevMenu. */
        if buildType == BuildType.Production { return false }
        if forceEnabled { return true }
        return enabledByDefault
    }

    @objc
    public func setBuildType(_ buildType: BuildType) {
        self.buildType = buildType
        /* we're enabled by default on non prod/beta builds */
        enabledByDefault =
            buildType != BuildType.Production &&
            buildType != BuildType.Beta
    }

    // MARK: - Public Methods

    private override init() {
        super.init()
        loadSettings()
        if enabled {
            ensureWebSocketStarted()
        }
    }

    @objc
    public func startSession() {
        dispatchQueue.async { [weak self] in
            if let s = self {
                s.sessionId = Date.now()
                self?.reportStopwatchData()
                self?.reportPendingLogEvents()
            }
        }
    }

    @objc
    public func stopSession() {
        dispatchQueue.async { [weak self] in
            if let s = self {
                s.activeStopwatches = []
                s.events = []
                s.sessionId = 0
            }
        }
    }

    @objc
    public func nextUniqueId() -> Int {
        uniqueId.increment()
        return uniqueId.value
    }

    @objc
    public func create(stopwatch: String, options: [String: Any]) {
        if !enabled {
            return
        }
        dispatchQueue.async { [weak self] in
            self?.stopwatchOptions[stopwatch] = options
        }
    }

    @objc
    public func start(stopwatch: String, workName: String, workId: String, priority: Double) {
        if !enabled {
            return
        }
        dispatchQueue.async { [weak self] in
            self?.ensure(stopwatch, priority: priority).startWork(workName, id: workId)
        }
    }

    @objc
    public func stop(stopwatch: String, workId: String, context: [String: Any] = defaultStopwatchContext) {
        if !enabled {
            return
        }
        dispatchQueue.async { [weak self] in
            if let s = self {
                s.ensure(stopwatch).endWork(workId, context: context)
                s.reportStopwatchData()
            }
        }
    }

    @objc
    public func checkpoint(stopwatch: String, workId: String, name: String) {
        if !enabled {
            return
        }
        dispatchQueue.async { [weak self] in
            self?.ensure(stopwatch).checkpointWork(workId, name: name)
            self?.reportStopwatchData()
        }
    }

    @objc
    public func record(stopwatch: String, workName: String, workId: String, start: Double, end: Double, priority: Double, context: [String: Any] = defaultStopwatchContext) {
        if !enabled {
            return
        }
        dispatchQueue.async { [weak self] in
            self?.ensure(stopwatch, priority: priority).recordWork(workName, id: workId, start: Int64(start), end: Int64(end), context: context)
            self?.reportStopwatchData()
        }
    }

    @objc
    public func report() {
        if !enabled || sessionId == 0 {
            return
        }
        dispatchQueue.async { [weak self] in
            if let s = self {
                s.ensureWebSocketStarted()
                s.reportStopwatchData()
            }
        }
    }

    @objc
    public func onStarted() {
        let notificationName = Notification.Name(Piggy.AppStartedEvent)
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: notificationName, object: nil)
        }
    }

    @objc
    public func getConfiguration(_ resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
        resolve(buildConfiguration())
    }

    @objc
    public func setConfiguration(_ options: [String: Any],
                          resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
        let originalHostname = hostname
        saveSettings(options)
        if originalHostname != hostname {
            webSocket?.disconnect()
            webSocket = nil
            ensureWebSocketStarted()
        }
        resolve(buildConfiguration())
    }

    @objc
    public func logEvent(_ event: [String: Any]) {
        if !enabled {
            return
        }
        dispatchQueue.async { [weak self] in
            if let s = self {
                let message: [String:Any] = [
                    Constants.Key.Name: Constants.Message.EventLogSend,
                    Constants.Key.SessionId: s.sessionId,
                    Constants.Key.Data: event,
                ]

                if s.sessionId != 0 {
                    if let socket = s.webSocket {
                        if socket.isConnected {
                            if let data = try? JSONSerialization.data(withJSONObject: message) {
                                socket.write(data: data)
                                return
                            }
                        }
                    }
                }

                /* if we fall through to here, that means the data was not written.
                 cache it so we can dispatch when the socket has connected again */
                s.events.append(message)
                let diff = s.events.count - Constants.MaxPendingEvents
                if diff > 0 {
                    s.events = Array(s.events[diff ..< s.events.count])
                }
            }
        }
    }

    @objc
    public func logConsoleEvent(_ tag: String, _ level: String, _ message: String) {
        if enabled {
            logEvent([
                Constants.Key.LogType: Constants.EventLogType.Console,
                Constants.Key.Level: level,
                Constants.Key.Tag: "native-ios/\(tag)",
                Constants.Key.Timestamp: Date.now(),
                Constants.Key.Data: [
                    Constants.Key.Arguments: [message],
                ],
            ])
        }
    }

    @objc
    public func logConsoleEvent(_ tag: String, _ level: String, data: [String:Any], _ title: String = "data") {
        if enabled {
            logEvent([
                Constants.Key.LogType: Constants.EventLogType.Console,
                Constants.Key.Level: level,
                Constants.Key.Tag: "native-ios/\(tag)",
                Constants.Key.Timestamp: Date.now(),
                Constants.Key.Data: [
                    Constants.Key.Arguments: [title, data],
                ],
            ])
        }
    }

    @objc
    public func findWorkId(_ stopwatch: String, workName: String) -> String? {
        return activeStopwatches.first { $0.name == stopwatch }?.findByWorkName(workName)?.id
    }

    // MARK: - TCP over USB

    @objc
    public func disableTcpForwarding() {
        forwardedPorts.forEach({ $0.close() })
        forwardedPorts = []
    }

    @objc
    public func enableTcpForwarding(with ports: [UInt: UInt]? = nil) {
        #if targetEnvironment(simulator)
            print("enableTcpForwarding: detected simulator. not enabling")
            enableBridgeForwarding = false
            return
        #else
            let resolvedPorts: [UInt: UInt] = ports != nil
                ? ports! : getDefaultTcpOverUsbPorts(for: buildType)
            enableBridgeForwarding = resolvedPorts[8081] != nil
            disableTcpForwarding()
            resolvedPorts.forEach({ originalPort, virtualPort in
                let client = FBPortForwardingServer()
                if let c = client {
                    c.forwardConnections(fromPort: originalPort)
                    c.listenForMultiplexingChannel(onPort: virtualPort)
                    forwardedPorts.append(c)
                }
            })
        #endif
    }

    @objc
    public func getBundleUrl(for bridge: RCTBridge!) -> URL! {
        if enableBridgeForwarding {
            return RCTBundleURLProvider.jsBundleURL(
                forBundleRoot: "index",
                packagerHost: "localhost",
                enableDev: RCTBundleURLProvider.sharedSettings()?.enableDev ?? false,
                enableMinification: RCTBundleURLProvider.sharedSettings()?.enableMinification ?? true
            )
        } else {
            return RCTBundleURLProvider
                .sharedSettings()
                .jsBundleURL(forBundleRoot: "index", fallbackURLProvider: { nil })
        }
    }

    @objc
    public func getDefaultTcpOverUsbPorts(for buildType: BuildType) -> [UInt:UInt] {
        switch (buildType) {
        case BuildType.Debug:
            return Constants.TcpOverUsbPorts.Debug
        case BuildType.Beta:
            return Constants.TcpOverUsbPorts.Beta
        default:
            return Constants.TcpOverUsbPorts.Production
        }
    }

    // MARK: - Private Properties

    private var hostname: String {
        if let override = hostnameOverride {
            if !override.isEmpty {
                return override
            }
        }
        return Constants.Url.DefaultHostname
    }

    // MARK: - Private Methods

    private func reportStopwatchData() {
        if sessionId == 0 {
            return
        }

        let socket = webSocket

        var leftovers = [Stopwatch]()
        activeStopwatches.forEach { finishedWatch in
            var units = finishedWatch.workUnits
            let leftoverWatch = Stopwatch(finishedWatch.name, priority: finishedWatch.priority)
            let pivot = units.partition { $0.end >= 0 }
            finishedWatch.workUnits = Array(units[pivot ..< units.count])
            leftoverWatch.workUnits = Array(units[0 ..< pivot])
            leftovers.append(leftoverWatch)
        }

        pendingStopwatches.append(contentsOf: activeStopwatches)
        activeStopwatches = leftovers

        if socket == nil || socket?.isConnected != true {
            ensureWebSocketStarted()
        } else if pendingStopwatches.count > 0 {
            if let jsonData = toJson(self.pendingStopwatches) {
                socket!.write(data: jsonData)
                pendingStopwatches = Array()
            }
        }
    }

    private func reportPendingLogEvents() {
        dispatchQueue.async { [weak self] in
            if let s = self {
                if let socket = s.webSocket {
                    if s.sessionId == 0 || !socket.isConnected {
                        return
                    }
                    s.events.forEach { event in
                        var updatedEvent = event
                        updatedEvent[Constants.Key.SessionId] = s.sessionId
                        if let data = try? JSONSerialization.data(withJSONObject: updatedEvent) {
                            socket.write(data: data)
                        }
                    }
                    s.events = Array()
                }
            }
        }
    }

    private func ensureWebSocketStarted() {
        dispatchQueue.async { [weak self] in
            if let s = self {
                if s.webSocket == nil {
                    let uri = "ws://\(s.hostname)/?type=ios&deviceId=\(s.deviceId)"
                    let socket = WebSocket(url: URL(string: uri)!)
                    socket.onConnect = {
                        s.dispatchQueue.async { [weak s] in
                            s?.reportStopwatchData()
                            s?.reportPendingLogEvents()
                        }
                    }
                    socket.onDisconnect = { _ in
                        if socket == s.webSocket {
                            s.webSocket = nil
                        }
                    }
                    socket.connect()
                    s.webSocket = socket
                }
            }
        }
    }

    private func resolvePriority(_ name: String) -> Double {
        let last = nameToPriority[name]
        return last != nil ? last! : Constants.DefaultPriority
    }

    private func ensure(_ name: String, priority: Double? = nil) -> Stopwatch {
        let resolvedPriority = priority != nil ? priority! : resolvePriority(name)
        var stopwatch = activeStopwatches.first { $0.name == name }
        if stopwatch == nil {
            nameToPriority[name] = resolvedPriority
            stopwatch = Stopwatch(name, priority: resolvedPriority)
            activeStopwatches.append(stopwatch!)
        }
        return stopwatch!
    }

    private func toJson(_ stopwatches: [Stopwatch]) -> Data? {
        if stopwatches.isEmpty {
            return nil
        }
        stopwatches.forEach { (stopwatch) in
            if let options = stopwatchOptions[stopwatch.name] {
                stopwatch.applyOptions(options)
            }
        }
        return try? JSONSerialization.data(withJSONObject: [
            Constants.Key.Name: Constants.Message.TimelineSend,
            Constants.Key.SessionId: sessionId,
            Constants.Key.Data: stopwatches.map { $0.toJson() },
        ])
    }

    private func key(_ name: String) -> String {
        return "\(Constants.Key.Prefix).\(name)"
    }

    private func buildConfiguration() -> [String: Any] {
        return [
            Constants.Key.Hostname: hostname,
            Constants.Key.SessionId: sessionId,
            Constants.Key.Enabled: enabled,
            Constants.Key.ForceEnabled: forceEnabled,
            Constants.Key.DeviceId: deviceId,
        ]
    }

    private func loadSettings() {
        if prefs.object(forKey: key(Constants.Key.Hostname)) != nil {
            hostnameOverride = prefs.string(forKey: key(Constants.Key.Hostname))
        }
        forceEnabled = prefs.bool(forKey: key(Constants.Key.ForceEnabled))
    }

    private func saveSettings(_ options: [String:Any]) {
        if let _ = options.index(forKey: Constants.Key.Hostname),
            let hostname = options[Constants.Key.Hostname] as? String {
            hostnameOverride = hostname
        }
        if let _ = options.index(forKey: Constants.Key.ForceEnabled),
            let force = options[Constants.Key.ForceEnabled] as? Bool {
            forceEnabled = force
        }
        prefs.set(hostnameOverride, forKey: key(Constants.Key.Hostname))
        prefs.set(forceEnabled, forKey: key(Constants.Key.ForceEnabled))
        prefs.synchronize()
    }
}

private class Checkpoint {
    var time: Int64
    var name: String

    init(time: Int64, name: String) {
        self.time = time
        self.name = name
    }

    func toDictionary() -> [String: Any] {
        return [Constants.Key.Time: time, Constants.Key.Name: name]
    }
}

private class Work {
    let name: String
    let id: String
    var start: Int64
    var end: Int64
    var context: [String: Any] = [:]
    var checkpoints: [Checkpoint] = Array()

    init(_ name: String, id: String, start: Int64 = -1, end: Int64 = -1, context: [String: Any] = Piggy.defaultStopwatchContext) {
        self.name = name
        self.id = id
        self.start = start
        self.end = end
        self.context = context

        if self.start == -1 {
            self.start = Date.now()
        }
    }

    func checkpoint(_ name: String) {
        checkpoints.append(Checkpoint(time: Date.now(), name: name))
    }

    func stop(_ context: [String: Any] = Piggy.defaultStopwatchContext) {
        end = Date.now()
        self.context = context
    }

    func toDictionary() -> [String: Any] {
        return [
            Constants.Key.Name: name,
            Constants.Key.Id: id,
            Constants.Key.Start: start,
            Constants.Key.End: end,
            Constants.Key.Context: context,
            Constants.Key.Checkpoints: checkpoints.map { $0.toDictionary() },
        ]
    }
}

private class Stopwatch {
    let name: String
    let priority: Double
    var colorHint: String?
    var workUnits: [Work] = Array()

    init(_ name: String, priority: Double) {
        self.name = name
        self.priority = priority
    }

    func startWork(_ name: String, id: String) {
        workUnits = workUnits.filter { $0.id != id }
        workUnits.append(Work(name, id: id))
    }

    func endWork(_ id: String, context: [String: Any] = Piggy.defaultStopwatchContext) {
        findById(id)?.stop(context)
    }

    func checkpointWork(_ id: String, name: String) {
        findById(id)?.checkpoint(name)
    }

    func recordWork(_ name: String, id: String, start: Int64, end: Int64, context: [String: Any] = Piggy.defaultStopwatchContext) {
        workUnits.append(Work(name, id: id, start: start, end: end, context: context))
    }

    func toJson() -> [String: Any] {
        return [
            Constants.Key.Name: name,
            Constants.Key.Priority: priority,
            Constants.Key.ColorHint: colorHint ?? "",
            Constants.Key.WorkUnits: workUnits.map { $0.toDictionary() },
        ]
    }

    func findById(_ id: String) -> Work? {
        return workUnits.first { $0.id == id }
    }

    func findByWorkName(_ workName: String) -> Work? {
        return workUnits.first { $0.name == workName }
    }

    func applyOptions(_ options: [String:Any]?) {
        if let o = options {
            colorHint = o[Constants.Key.ColorHint] as? String
        }
    }
}
