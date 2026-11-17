package com.appdepareja

import android.content.ContentUris
import android.content.Context
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import java.io.InputStream

/**
 * GallerySyncModule:
 * Permite consultar fotos recientes del dispositivo y convertirlas a Base64
 * para su sincronización automática en segundo plano hacia Supabase.
 */
class GallerySyncModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "GallerySyncModule"

    @ReactMethod
    fun getRecentPhotos(limit: Int, promise: Promise) {
        val photosArray = Arguments.createArray()
        val context: Context = reactApplicationContext

        val projection = arrayOf(
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.DATE_ADDED
        )

        val sortOrder = "${MediaStore.Images.Media.DATE_ADDED} DESC"

        try {
            val queryUri: Uri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            val cursor: Cursor? = context.contentResolver.query(
                queryUri,
                projection,
                null,
                null,
                sortOrder
            )

            cursor?.use {
                val idColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
                val nameColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME)
                val dateColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED)

                var count = 0
                while (it.moveToNext() && count < limit) {
                    val id = it.getLong(idColumn)
                    val name = it.getString(nameColumn) ?: "photo_$id.jpg"
                    val dateAdded = it.getLong(dateColumn)
                    val contentUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id)

                    val map = Arguments.createMap().apply {
                        putString("id", id.toString())
                        putString("name", name)
                        putString("uri", contentUri.toString())
                        putDouble("dateAdded", dateAdded.toDouble())
                    }
                    photosArray.pushMap(map)
                    count++
                }
            }
            promise.resolve(photosArray)
        } catch (e: Exception) {
            promise.reject("GALLERY_QUERY_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getPhotoBase64(uriString: String, maxWidth: Int, promise: Promise) {
        try {
            val uri = Uri.parse(uriString)
            val inputStream: InputStream? = reactApplicationContext.contentResolver.openInputStream(uri)

            val originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()

            if (originalBitmap == null) {
                promise.reject("DECODE_ERROR", "No se pudo decodificar la imagen")
                return
            }

            // Redimensionar proporcionalmente para optimizar subida en background
            val width = originalBitmap.width
            val height = originalBitmap.height
            val scale = if (width > maxWidth) maxWidth.toFloat() / width else 1f

            val resizedBitmap = if (scale < 1f) {
                Bitmap.createScaledBitmap(
                    originalBitmap,
                    (width * scale).toInt(),
                    (height * scale).toInt(),
                    true
                )
            } else {
                originalBitmap
            }

            val outputStream = ByteArrayOutputStream()
            resizedBitmap.compress(Bitmap.CompressFormat.JPEG, 75, outputStream)
            val byteArray = outputStream.toByteArray()
            val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)

            outputStream.close()
            if (resizedBitmap != originalBitmap) {
                resizedBitmap.recycle()
            }
            originalBitmap.recycle()

            promise.resolve(base64String)
        } catch (e: Exception) {
            promise.reject("CONVERT_ERROR", e.message)
        }
    }
}
