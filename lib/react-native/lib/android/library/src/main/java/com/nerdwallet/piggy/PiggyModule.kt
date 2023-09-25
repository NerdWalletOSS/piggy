package com.nerdwallet.piggy

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = "PiggyModule")
class PiggyModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val instance by lazy { Piggy.instance(context) }

    override fun getName(): String = "PiggyModule"

    init {
        instance.startSession()
    }

    @ReactMethod
    @Suppress("unused")
    fun create(stopwatch: String, options: ReadableMap) {
        instance.create(stopwatch, options)
    }

    @ReactMethod
    @Suppress("unused")
    fun start(stopwatch: String, workName: String, workId: String, priority: Double) {
        instance.start(stopwatch, workName, workId, priority.toInt())
    }

    @ReactMethod
    @Suppress("unused")
    fun stop(stopwatch: String, workId: String, context: ReadableMap) {
        instance.stop(stopwatch, workId, context.toMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun checkpoint(stopwatch: String, workId: String, checkpoint: String) {
        instance.checkpoint(stopwatch, workId, checkpoint)
    }

    @ReactMethod
    @Suppress("unused")
    fun record(stopwatch: String, workName: String, workId: String, start: Double, end: Double, priority: Double, context: ReadableMap) {
        instance.record(stopwatch, workName, workId, start, end, priority.toInt(), context.toMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun setConfiguration(options: ReadableMap, promise: Promise) {
        instance.setConfiguration(options, promise)
    }

    @ReactMethod
    @Suppress("unused")
    fun getConfiguration(promise: Promise) {
        instance.getConfiguration(promise)
    }

    @ReactMethod
    @Suppress("unused")
    fun onStarted() {
        instance.onStarted()
    }

    @ReactMethod
    @Suppress("unused")
    fun report() {
        instance.report()
    }

    @ReactMethod
    @Suppress("unused")
    fun logEvent(data: ReadableMap) {
        instance.logEvent(data)
    }

    @ReactMethod
    @Suppress("unused")
    fun getCookies(url: String, promise: Promise) {
        promise.resolve(createWritableMap(instance.getCookies(url)))
    }
}
