package com.nerdwallet.piggy

import com.facebook.react.bridge.*
import java.util.*

internal fun WritableMap.putAll(map: Map<*, *>) {
    map.map { (k, value) ->
        put(k, value)
    }
}

internal fun WritableMap.put(k: Any?, value: Any?) {
    val key = k as? String ?: return

    when (value) {
        is String -> this.putString(key, value)
        is Int -> this.putInt(key, value)
        is Boolean -> this.putBoolean(key, value)
        is Double -> this.putDouble(key, value)
        is ArrayList<*> -> this.putArrayList(key, value)
        is Array<*> -> this.putArray(key, value)
        is Map<*, *> -> this.putMap(key, value)
        else -> {
            if (value === null) {
                this.putNull(key)
            }
            else {

            }
        }
    }
}

internal fun WritableArray.push(item: Any?) {
    when (item) {
        is String -> this.pushString(item)
        is Int -> this.pushInt(item)
        is Boolean -> this.pushBoolean(item)
        is Double -> this.pushDouble(item)
        is ArrayList<*> -> this.pushArrayList(item)
        is Array<*> -> this.pushArray(item)
        is Map<*, *> -> this.pushMap(item)
        else -> {
            if (item === null) {
                this.pushNull()
            }
            else {
            }
        }
    }
}

fun WritableArray.pushArrayList(arrayList: ArrayList<*>) {
    this.pushArray(WritableNativeArray().apply {
        for (item in arrayList) {
            this.push(item)
        }
    })
}

internal fun WritableMap.putArray(key: String, array: Array<*>) {
    val writableArray = WritableNativeArray()
    writableArray.pushAll(array)
    this.putArray(key, writableArray)
}

internal fun WritableMap.putMap(key: String, map: Map<*, *>) {
    this.putMap(key, createWritableMap(map))
}

internal fun createWritableMap(data: Map<*,*>) = WritableNativeMap().apply { putAll(data) }

internal fun WritableMap.putArrayList(key: String, arrayList: ArrayList<*>) {
    val writableArray = WritableNativeArray()
    writableArray.pushAll(arrayList)
    this.putArray(key, writableArray)
}

internal fun WritableArray.pushAll(arrayList: ArrayList<*>) {
    arrayList.forEach {
        push(it)
    }
}

internal fun WritableArray.pushAll(array: Array<*>) {
    array.forEach {
        push(it)
    }
}

internal fun WritableArray.pushArray(array: Array<*>) {
    this.pushArray(WritableNativeArray().apply {
        pushAll(array)
    })
}

internal fun WritableArray.pushMap(map: Map<*, *>) {
    val writableMap = createWritableMap(map)
    this.pushMap(writableMap)
}

internal fun ReadableArray.toList(): List<Any?> {
    val arrayList = ArrayList<Any?>()

    for (i in 0 until this.size()) {
        when (getType(i)) {
            ReadableType.Null -> arrayList.add(null)
            ReadableType.Boolean -> arrayList.add(getBoolean(i))
            ReadableType.Number -> arrayList.add(getDouble(i))
            ReadableType.String -> arrayList.add(getString(i))
            ReadableType.Map -> arrayList.add(getMap(i)?.toMap() ?: mapOf<String, Any?>())
            ReadableType.Array -> arrayList.add(getArray(i)?.toList() ?: listOf<Any?>())
            else -> throw IllegalArgumentException("Could not convert object at index: $i.")
        }
    }
    return arrayList
}

internal fun ReadableMap.toMap(): Map<String, Any?> {
    val iterator = keySetIterator()
    val map = HashMap<String, Any?>()

    while (iterator.hasNextKey()) {
        val key = iterator.nextKey()
        when (getType(key)) {
            ReadableType.Null -> map[key] = null
            ReadableType.Boolean -> map[key] = getBoolean(key)
            ReadableType.Number -> map[key] = getDouble(key)
            ReadableType.String -> map[key] = getString(key)
            ReadableType.Map -> map[key] = getMap(key)?.toMap() ?: mapOf<String, Any?>()
            ReadableType.Array -> map[key] = getArray(key)?.toList() ?: listOf<String>()
            else -> throw IllegalArgumentException("Could not convert object with key: $key.")
        }
    }
    return map
}
