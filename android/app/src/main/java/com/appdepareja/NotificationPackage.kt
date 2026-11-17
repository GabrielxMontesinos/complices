package com.appdepareja

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Registra el NotificationModule como paquete de React Native.
 * Se agrega manualmente en MainApplication.kt.
 */
class NotificationPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
        listOf(
            NotificationModule(ctx),
            GallerySyncModule(ctx),
            LocationModule(ctx)
        )

    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
