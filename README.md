블루투스 연결을 지원하는 귀뚜라미 카본매트용 Homebridge 플러그인입니다.

현재 전원 켜기/끄기만을 지원합니다. 온도 조절 및 모드 변경 등의 기능은 지원하지 않습니다.

# 요구사항
* [Homebridge](https://homebridge.io/)
* gatttool이 설치된 Linux 환경

# 지원 제품
작동 확인이 되지 않은 제품은 이론상 지원되나 아직 확인이 되지 않은 것입니다.
* KDM-851 - 작동 확인
* KDM-852 - 작동 확인 안됨
* KDM-853 - 작동 확인 안됨
* KDM-871 - 작동 확인 안됨
* KDM-872 - 작동 확인 안됨
* KDM-873 - 작동 확인 안됨

# config
Homebridge Config UI X 를 사용할 경우 웹 UI 상의 설정을 지원합니다.

해당 플러그인을 사용하지 않을 경우 아래를 참조하세요.

```json
"accessories": [
  {
    "accessory": "KituramiDCMat",
    "name": "귀뚜라미 카본매트",
    "address": "XX:XX:XX:XX:XX:XX",
    "poll": false,
    "pollInterval": 30
  }
],
```

* ```accessory```: 해당 액세서리가 사용할 러그인을 나타냅니다. 그대로 두세요.
* ```name```: 해당 액세서리가 홈 앱에서 나타날 이름입니다.
* ```address```: 제어할 매트의 블루투스 MAC 주소입니다.
* ```poll```: 매트의 전원 상태를 정기적으로 확인할지의 여부입니다.
* ```pollInterval```: 매트의 전원 상태를 정기적으로 확인할 주기입니다.