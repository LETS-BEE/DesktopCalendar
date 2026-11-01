#include <node_api.h>

namespace {

napi_value DisableMinimize(napi_env env, napi_callback_info) {
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
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
