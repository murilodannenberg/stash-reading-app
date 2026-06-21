package com.stashinit

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class ShareIntentModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ShareIntentModule"

    /** Retorna a URL/texto recebido via share intent (ou null se nenhum pendente). */
    @ReactMethod
    fun getSharedUrl(promise: Promise) {
        promise.resolve(MainActivity.pendingSharedUrl)
    }

    /** Limpa a URL pendente depois que o JS a processou. */
    @ReactMethod
    fun clearSharedUrl() {
        MainActivity.pendingSharedUrl = null
    }
}
