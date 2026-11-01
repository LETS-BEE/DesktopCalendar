{
    "targets": [
        {
            "target_name": "electron-disable-minimize",
            "sources": [],
            "defines": [
                "NAPI_VERSION=8"
            ],
            "conditions": [
                ['OS=="win"', {'sources':['lib.cc']},  { "sources": ["none.cc"] }],
            ]
        }
    ]
}
