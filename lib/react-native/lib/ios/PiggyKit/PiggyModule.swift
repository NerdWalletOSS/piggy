import Foundation
import React

@objc(PiggyModule)
public final class PiggyModule: RCTEventEmitter {
    override init() {
        super.init()
        Piggy.instance.startSession()
    }

    // MARK: -
    
    public override func supportedEvents() -> [String]! {
        return [];
    }

    override public static func requiresMainQueueSetup() -> Bool {
        return true
    }

    // MARK: -

    @objc(create: options:)
    func create(stopwatch: String, options: [String:Any]) {
        Piggy.instance.create(stopwatch: stopwatch, options: options)
    }

    @objc(start: workName: workId: priority:)
    func start(stopwatch: String, workName: String, workId: String, priority: Double) {
        Piggy.instance.start(stopwatch: stopwatch, workName: workName, workId: workId, priority: Int(priority))
    }

    @objc(stop: workId: context:)
    func stop(stopwatch: String, workId: String, context: [String:Any] = Piggy.defaultStopwatchContext) {
        Piggy.instance.stop(stopwatch: stopwatch, workId: workId, context: context)
    }

    @objc(checkpoint: workId: context:)
    func checkpoint(stopwatch: String, workId: String, name: String) {
        Piggy.instance.checkpoint(stopwatch: stopwatch, workId: workId, name: name)
    }

    @objc(record: workName: workId: start: end: priority: context:)
    func record(stopwatch: String, workName: String, workId: String, start: Double, end: Double, priority: Double, context: [String:Any] = Piggy.defaultStopwatchContext) {
        Piggy.instance.record(stopwatch: stopwatch, workName: workName, workId: workId, start: start, end: end, priority: Int(priority), context: context)
    }

    @objc
    func report() {
        Piggy.instance.report()
    }

    @objc
    func onStarted() {
        Piggy.instance.onStarted()
    }

    @objc
    func getConfiguration(_ resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
        Piggy.instance.getConfiguration(resolve, reject: reject)
    }

    @objc
    func setConfiguration(_ options: [String:Any],
                          resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
        Piggy.instance.setConfiguration(options, resolve: resolve, reject: reject)
    }

    @objc
    func logEvent(_ event: [String:Any]) {
        Piggy.instance.logEvent(event)
    }

    @objc
    func getCookies(_ url: String,
                    resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
        var cookies: [String:String?] = [:]
        HTTPCookieStorage.shared.cookies(for: URL.init(string: url)!)?.forEach({ (cookie: HTTPCookie) in
            cookies[cookie.name] = cookie.value
        })
        resolve(cookies);
    }
}
