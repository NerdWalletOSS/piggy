package com.nerdwallet.piggy

import android.content.Context
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.google.gson.FieldNamingPolicy
import com.google.gson.GsonBuilder
import com.google.gson.annotations.Expose
import okhttp3.*
import org.greenrobot.eventbus.EventBus
import java.net.URI
import java.net.URLEncoder
import java.util.*
import kotlin.collections.set

class Piggy private constructor(context: ReactApplicationContext) {
    private val stopwatchOptions = mutableMapOf<String, Map<String, Any?>>()
    private var unfinishedStopwatches = mutableListOf<Stopwatch>()
    private var pendingStopwatches = mutableListOf<Stopwatch>()
    private var pendingEvents = mutableListOf<ReadableMap>()
    private var nameToPriority = mutableMapOf<String, Int>()
    private var hostnameOverride: String? = null
    private var forceEnabled: Boolean = false
    private val prefs = context.getSharedPreferences("timeliner", Context.MODE_PRIVATE)
    private var webSocket: WebSocket? = null
    private var webSocketConnected = false
    private var sessionId = 0L

    private val cookies: ForwardingCookieHandler = ForwardingCookieHandler(
        ReactApplicationContext(context.applicationContext))

    private val deviceId: String by lazy {
        URLEncoder.encode(
            Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID),
            "UTF-8")
    }

    private val gson = GsonBuilder()
        .setFieldNamingPolicy(FieldNamingPolicy.IDENTITY)
        .apply { excludeFieldsWithoutExposeAnnotation() }
        .create()

    val eventBus = EventBus()

    class AppStartedEvent

    init {
        loadSharedPrefs()
    }

    var enabled: Boolean = false
        get() {
            /* tooling is NEVER enabled for "production" flavors. for "beta" flavors
            it's disabled by default, but the user can "force enable" it in the
            app Developer Menu */
            if (buildFlavor == Flavor.PRODUCTION) { return false }
            if (forceEnabled) { return true }
            return field
        }
        private set(value) {
            if (buildFlavor != Flavor.PRODUCTION) {
                field = value
                if (enabled) {
                    ensureWebSocketStarted()
                }
            }
        }

    var buildFlavor: String = Flavor.PRODUCTION
        set(value) {
            field = value
            enabled = when (buildFlavor) {
                Flavor.PRODUCTION, Flavor.BETA -> false
                else -> true
            }
        }

    fun workIdFromName(stopwatchName: String, workName: String): String? =
        ensure(stopwatchName).findIdByName(workName)

    fun startSession() {
        synchronized (this) {
            sessionId = System.currentTimeMillis()
            reportStopwatchData()
            reportPendingEvents()
        }
    }

    fun stopSession() {
        synchronized (this) {
            unfinishedStopwatches.clear()
            pendingEvents = mutableListOf()
            sessionId = 0L
        }
    }

    fun create(stopwatch: String, options: Map<String, Any?> = mapOf()) {
        stopwatchOptions[stopwatch] = options
    }

    fun create(stopwatch: String, options: ReadableMap) {
        create(stopwatch, options.toMap())
    }

    fun start(stopwatch: String, workName: String, workId: String, priority: Int) {
        synchronized(this) {
            if (enabled) {
                ensure(stopwatch, priority).startWork(workName, workId)
            }
        }
    }

    fun stop(stopwatch: String, workId: String, context: Map<String, Any?>) {
        synchronized(this) {
            if (enabled) {
                ensure(stopwatch).endWork(workId, context)
                reportStopwatchData()
            }
        }
    }

    fun stop(stopwatch: String, workId: String, context: String) =
        stop(stopwatch, workId, mapOf("value" to context))


    fun checkpoint(stopwatch: String, workId: String, checkpoint: String) {
        synchronized(this) {
            if (enabled) {
                ensure(stopwatch).checkpointWork(workId, checkpoint)
                reportStopwatchData()
            }
        }
    }

    fun record(stopwatch: String, workName: String, workId: String, start: Double, end: Double, priority: Int, context: String) =
        record(stopwatch, workName, workId, start, end, priority, mapOf("value" to context))

    fun record(stopwatch: String, workName: String, workId: String, start: Double, end: Double, priority: Int, context: Map<String, Any?>) {
        synchronized(this) {
            if (enabled) {
                ensure(stopwatch, priority).recordWork(workName, workId, start.toLong(), end.toLong(), context)
                reportStopwatchData()
            }
        }
    }

    fun setConfiguration(options: ReadableMap, promise: Promise) {
        synchronized(this) {
            val originalHostname = hostname
            if (options.hasKey(Key.HOSTNAME)) {
                hostnameOverride = options.getString(Key.HOSTNAME)
            }
            forceEnabled = when {
                !options.hasKey(Key.FORCE_ENABLED) || options.isNull(Key.FORCE_ENABLED) -> false
                else -> options.getBoolean(Key.FORCE_ENABLED)
            }
            saveSharedPrefs()
            if (hostname !== originalHostname) {
                this.webSocket?.cancel()
                this.webSocket = null
                ensureWebSocketStarted()
            }
            promise.resolve(buildConfiguration())
        }
    }

    fun getConfiguration(promise: Promise) {
        synchronized(this) {
            promise.resolve(buildConfiguration())
        }
    }

    fun onStarted() {
        synchronized(this) {
            if (enabled) {
                eventBus.post(AppStartedEvent())
            }
        }
    }

    fun report() {
        synchronized(this) {
            reportStopwatchData()
        }
    }

    fun logEvent(data: ReadableMap) {
        synchronized(this) {
            if (enabled) {
                if (sessionId == 0L || !webSocketConnected) {
                    pendingEvents.add(data)
                    truncatePendingEventLogIfNecessary()
                }
                else {
                    val message = gson.toJson(mapOf(
                        Key.NAME to Message.EVENTLOG_SEND,
                        Key.SESSION_ID to sessionId.toDouble(),
                        Key.DATA to data.toHashMap()))

                    webSocket?.send(message.toString()) ?: run {
                        ensureWebSocketStarted()
                    }
                }
            }
        }
    }

    fun logConsoleEvent(tag: String, level: String, message: String) {
        synchronized(this) {
            logEvent(WritableNativeMap().apply {
                putString(Key.TYPE, EventType.CONSOLE)
                putString(Key.LEVEL, level)
                putString(Key.TAG, "native-android/$tag")
                putDouble(Key.TIMESTAMP, System.currentTimeMillis().toDouble())
                putMap(Key.DATA, WritableNativeMap().apply {
                    putArray(Key.ARGUMENTS, WritableNativeArray().apply { pushString(message) })
                })
            })
        }
    }

    fun logConsoleEvent(tag: String, level: String, data: Map<String, Any?>, title: String = "data") {
        synchronized(this) {
            logEvent(WritableNativeMap().apply {
                putString(Key.TYPE, EventType.CONSOLE)
                putString(Key.LEVEL, level)
                putString(Key.TAG, "native-android/$tag")
                putDouble(Key.TIMESTAMP, System.currentTimeMillis().toDouble())
                putMap(Key.DATA, WritableNativeMap().apply {
                    putArray(Key.ARGUMENTS, WritableNativeArray().apply {
                        pushString(title)
                        pushMap(data)
                    })
                })
            })
        }
    }

    fun getCookies(url: String): Map<String, String> {
        val uri = URI(url)
        val map = mutableMapOf<String, String>()
        cookies.get(uri, mapOf())["Cookie"]?.forEach { cookieString ->
            val cookies = cookieString.split(";".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
            for (i in cookies.indices) {
                val cookie = cookies[i].split("=".toRegex(), 2).toTypedArray()
                if (cookie.size > 1) {
                    map[cookie[0].trim { it <= ' ' }] = cookie[1]
                }
            }
        }
        return map
    }

    private fun truncatePendingEventLogIfNecessary() {
        /* let's not allow the pending events list to grow unbounded */
        val diff = pendingEvents.size - Default.MAX_PENDING_EVENTS
        if (diff > Default.MAX_PENDING_EVENTS) {
            pendingEvents = pendingEvents.slice(diff until pendingEvents.size).toMutableList()
        }
    }

    private fun ensureWebSocketStarted() {
        synchronized(this) {
            if (enabled && webSocket == null) {
                webSocket = Default.HTTP_CLIENT.newWebSocket(
                    Request.Builder().url("ws://$hostname?type=android&deviceId=$deviceId").build(),
                    webSocketEventListener)
            }
        }
    }

    private fun resetWebSocket() {
        synchronized(this) {
            webSocket?.cancel()
            webSocket = null
            webSocketConnected = false
        }
    }

    private val webSocketEventListener = object:WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            synchronized(this@Piggy) {
                webSocketConnected = true
                reportStopwatchData()
                reportPendingEvents()
            }
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            synchronized(this@Piggy) {
                if (webSocket == this@Piggy.webSocket) {
                    resetWebSocket()
                }
            }
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            synchronized(this@Piggy) {
                if (webSocket == this@Piggy.webSocket) {
                    resetWebSocket()
                }
            }
        }
    }

    private fun buildConfiguration(): ReadableMap =
        WritableNativeMap().apply {
            putString(Key.HOSTNAME, hostname)
            putDouble(Key.SESSION_ID, sessionId.toDouble())
            putBoolean(Key.ENABLED, enabled)
            putBoolean(Key.FORCE_ENABLED, forceEnabled)
            putString(Key.DEVICE_ID, deviceId)
        }

    private fun loadSharedPrefs() {
        hostnameOverride = prefs.getString(Key.HOSTNAME, "")
        forceEnabled = when (prefs.contains(Key.FORCE_ENABLED)) {
            true -> prefs.getBoolean(Key.FORCE_ENABLED, false)
            false -> false
        }
    }

    private fun saveSharedPrefs() {
        prefs.edit().apply {
            putString(Key.HOSTNAME, hostnameOverride)
            putBoolean(Key.FORCE_ENABLED, forceEnabled)
        }.apply()
    }

    private fun reportPendingEvents() {
        if (sessionId != 0L && webSocketConnected) {
            pendingEvents.forEach {
                webSocket?.send(gson.toJson(mapOf(
                    Key.NAME to Message.EVENTLOG_SEND,
                    Key.SESSION_ID to sessionId.toDouble(),
                    Key.DATA to it.toHashMap())))
            }
            pendingEvents.clear()
        }
    }

    private fun reportStopwatchData() {
        if (sessionId == 0L) {
            return
        }
        if (unfinishedStopwatches.isNotEmpty()) {
            /* some work may still be in progress. we'll move those over to a new
            "leftovers" data structure, send the finished work, then promote the
            leftovers to what we're currently tracking. */
            var validWorkUnits = 0
            val leftovers = mutableListOf<Stopwatch>()
            unfinishedStopwatches.forEach { watch ->
                val newWatch = Stopwatch(watch.name, watch.priority)
                leftovers.add(newWatch)
                val partitioned = watch.workUnits.partition { it.end >= 0 }
                watch.workUnits = partitioned.first.toMutableList()
                newWatch.workUnits = partitioned.second.toMutableList()
                validWorkUnits += watch.workUnits.size
            }

            pendingStopwatches.addAll(unfinishedStopwatches)
            unfinishedStopwatches = leftovers

            if (webSocketConnected) {
                if (pendingStopwatches.isNotEmpty()) {
                    pendingStopwatches.forEach {
                        it.applyOptions(stopwatchOptions[it.name])
                    }
                    webSocket?.let {
                        val sent = it.send(gson.toJson(mapOf(
                            Key.NAME to Message.TIMELINE_SEND,
                            Key.SESSION_ID to sessionId.toDouble(),
                            Key.DATA to pendingStopwatches)))

                        if (sent) {
                            pendingStopwatches.clear()
                        }
                    }
                }
            }
            else {
                ensureWebSocketStarted()
            }
        }
    }

    private fun ensure(name: String, priority: Int? = null): Stopwatch {
        val resolvedPriority = when (priority) {
            null -> nameToPriority[name] ?: Default.PRIORITY
            else -> priority
        }
        var stopwatch = find(name)
        if (stopwatch == null) {
            stopwatch = Stopwatch(name, resolvedPriority)
            nameToPriority[name] = resolvedPriority
            unfinishedStopwatches.add(stopwatch)
        }
        return stopwatch
    }

    private fun find(name: String): Stopwatch? = unfinishedStopwatches.find { it.name == name }

    private class Stopwatch(@Expose val name: String, @Expose val priority: Int) {
        @Expose var workUnits = mutableListOf<Work>()
        @Expose var colorHint: String? = null

        fun startWork(name: String, id: String = UUID.randomUUID().toString()): String {
            workUnits.removeAll { it.id == id }
            workUnits.add(Work(name, id))
            return id
        }

        fun endWork(id: String, context: Map<String, Any?> = mapOf()) {
            find(id)?.stop(context)
        }

        fun checkpointWork(id: String, name: String) {
            find(id)?.checkpoint(name)
        }

        fun recordWork(name: String, id: String, start: Long, end: Long, context: Map<String, Any?> = mapOf()) {
            workUnits.add(Work(name, id, start, end, context))
        }

        fun findIdByName(name: String): String? {
            return workUnits.firstOrNull{ it.name == name }?.id
        }

        fun applyOptions(options: Map<String, Any?>?) {
            options?.let {
                colorHint = it[Key.COLOR_HINT] as? String
            }
        }

        private fun find(id: String): Work? {
            return workUnits.firstOrNull { it.id == id }
        }
    }

    private data class Checkpoint(
        @Expose val time: Long,
        @Expose val name: String)

    private class Work(
        @Expose val name: String,
        @Expose val id: String,
        @Expose @Suppress("unused") val start: Long = System.currentTimeMillis(),
        @Expose var end: Long = -1L,
        @Expose var context: Map<String, Any?> = mapOf())
    {
        @Expose private val checkpoints = mutableListOf<Checkpoint>()

        fun checkpoint(name: String) {
            checkpoints.add(Checkpoint(System.currentTimeMillis(), name))
        }

        fun stop(context: Map<String, Any?>) {
            this.end = System.currentTimeMillis()
            this.context = context
        }
    }

    private val hostname
        get() = if (hostnameOverride.isNullOrEmpty()) Default.HOST else hostnameOverride

    object Flavor {
        const val PRODUCTION = "production"
        const val BETA = "beta"
        const val DEBUG = "debug"
    }

    object ColorHint {
        const val WHITE = "white"
        const val BLUE = "blue"
        const val GREEN = "green"
        const val YELLOW = "yellow"
        const val CYAN = "cyan"
        const val MAGENTA = "magenta"
        const val RED = "red"
    }

    private object Key {
        const val NAME = "name"
        const val SESSION_ID = "sessionId"
        const val DATA = "data"
        const val HOSTNAME = "hostname"
        const val TYPE = "type"
        const val LEVEL = "level"
        const val TAG = "tag"
        const val ARGUMENTS = "arguments"
        const val TIMESTAMP = "timestamp"
        const val ENABLED = "enabled"
        const val FORCE_ENABLED = "forceEnabled"
        const val DEVICE_ID = "deviceId"
        const val COLOR_HINT = "colorHint"
    }

    private object EventType {
        const val CONSOLE = "console"
    }

    private object Message {
        const val TIMELINE_SEND = "/timeline/send"
        const val EVENTLOG_SEND = "/eventLog/send"
    }

    private object Default {
        const val MAX_PENDING_EVENTS = 250
        const val PRIORITY = 10000
        val HOST = if (isEmulator) "10.0.2.2:8347" else "127.0.0.1:8347"
        val HTTP_CLIENT = OkHttpClient()

        val isEmulator: Boolean
            get() {
                /* https://stackoverflow.com/a/21505193/11472624 */
                return Build.FINGERPRINT.startsWith("generic") ||
                    Build.FINGERPRINT.startsWith("unknown") ||
                    Build.MODEL.contains("sdk_gphone") ||
                    Build.MODEL.contains("google_sdk") ||
                    Build.MODEL.contains("Emulator") ||
                    Build.MODEL.contains("Android SDK built for x86") ||
                    Build.MANUFACTURER.contains("Genymotion") ||
                    (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) ||
                    Build.PRODUCT == "google_sdk"
            }
    }

    companion object {
        private var singleton: Piggy? = null

        fun instance(context: Context): Piggy {
            if (singleton == null) {
                singleton = Piggy(ReactApplicationContext(context))
            }
            return singleton!!
        }
    }
}
