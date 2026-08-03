#include <windows.h>

#include <algorithm>
#include <cstdint>
#include <cstring>
#include <node_api.h>

namespace {

napi_value ToBoolean(napi_env env, bool value) {
    napi_value result;
    napi_get_boolean(env, value, &result);
    return result;
}

napi_value DisableMinimize(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc != 1) {
        napi_throw_type_error(
            env,
            nullptr,
            "DisableMinimize expects one BrowserWindow native handle Buffer."
        );
        return nullptr;
    }

    bool isBuffer = false;
    napi_is_buffer(env, args[0], &isBuffer);
    if (!isBuffer) {
        napi_throw_type_error(
            env,
            nullptr,
            "Argument must be BrowserWindow.getNativeWindowHandle()."
        );
        return nullptr;
    }

    void* bufferData = nullptr;
    size_t bufferLength = 0;
    napi_get_buffer_info(env, args[0], &bufferData, &bufferLength);
    if (bufferData == nullptr || bufferLength == 0) {
        napi_throw_range_error(env, nullptr, "Native window handle Buffer is empty.");
        return nullptr;
    }

    uintptr_t rawHandle = 0;
    std::memcpy(
        &rawHandle,
        bufferData,
        std::min(bufferLength, sizeof(rawHandle))
    );
    HWND windowHandle = reinterpret_cast<HWND>(rawHandle);
    if (!IsWindow(windowHandle)) {
        return ToBoolean(env, false);
    }

    HWND desktop = GetDesktopWindow();
    HWND workerWindow = nullptr;
    HWND shellViewWindow = nullptr;

    while ((workerWindow = FindWindowExA(
        desktop,
        workerWindow,
        "WorkerW",
        nullptr
    )) != nullptr) {
        shellViewWindow = FindWindowExA(
            workerWindow,
            nullptr,
            "SHELLDLL_DefView",
            nullptr
        );
        if (shellViewWindow != nullptr) {
            break;
        }
    }

    if (shellViewWindow == nullptr) {
        return ToBoolean(env, false);
    }

    SetLastError(ERROR_SUCCESS);
    const LONG_PTR previousParent = SetWindowLongPtr(
        windowHandle,
        GWLP_HWNDPARENT,
        reinterpret_cast<LONG_PTR>(shellViewWindow)
    );
    const bool succeeded =
        previousParent != 0 || GetLastError() == ERROR_SUCCESS;

    return ToBoolean(env, succeeded);
}

napi_value Initialize(napi_env env, napi_value exports) {
    napi_value disableMinimize;
    napi_create_function(
        env,
        "DisableMinimize",
        NAPI_AUTO_LENGTH,
        DisableMinimize,
        nullptr,
        &disableMinimize
    );
    napi_set_named_property(
        env,
        exports,
        "DisableMinimize",
        disableMinimize
    );
    return exports;
}

}  // namespace

NAPI_MODULE(NODE_GYP_MODULE_NAME, Initialize)
