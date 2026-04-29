---
title: Cloak 랜섬웨어 분석
author: east1otus
date: 2025-11-24 +0900
categories: [Reversing, Malware Analysis]
tags: [Reversing, Malware, Ransomware, BoB]
---
<br>

> **파일 정보**  
**파일 포맷**: PE (32-bit)  
**SHA-256**: d6af700fb86d3a3a832ba49273453b9c35c89978e4855ce9033b9770d938881c

<br>

## 개요
Cloak은 2022년경부터 활동을 시작한 랜섬웨어로, RaaS 형태를 지원한다고 한다.
해당 샘플은 사회공학적 기법 및 안티디버깅 로직을 포함하고 있으며, 비표준 HC-128 알고리즘을 이용해 파일을 암호화한다.
- 암호화 파일 확장자: .crYpt
- 랜섬노트 이름: readme_for_unlock.txt  

<br>

## 정상 업데이트 파일 가장
해당 샘플은 정상적인 윈도우 업데이트 파일로 위장하여 피해자가 직접 실행하도록 의도한 것으로 보인다.  
- 윈도우에서 사용하는 설치 파일 아이콘을 사용하고 있다.  
![1](/assets/img/2025-11-24-1/1.png){: width="150" .left}  
<br style="clear: both;">
- FileDescription도 "Microsoft Windows Update" 로 설정되어 있다.  
![2](/assets/img/2025-11-24-1/2.png){: width="600" .left}  
<br style="clear: both;">

> Microsoft Windows Update라는 이름을 가진 공식 exe 파일은 없으며, 특히 MS 사의 서명이 없다는 점에서 먼저 의심해볼 수 있다.  
![3](/assets/img/2025-11-24-1/3.png){: width="400" .left}  
<br style="clear: both;">
{: .prompt-warning }

<br>

## 준비 단계
실행 초반에 다음 세 함수를 거쳐 악성 행위를 위한 준비를 거친다.
![4](/assets/img/2025-11-24-1/4.png){: width="600" .left}  
<br style="clear: both;">
간략히 설명하자면, 자가복제를 통해 실행 위치를 재구성하고 실행 환경을 정리한 뒤, 부모 프로세스를 종료하고 실행 파일 삭제를 시도하는 로직이다.

<br>

#### sub_4077E0
![5](/assets/img/2025-11-24-1/5.png){: width="600" .left}
<br style="clear: both;">
- `GetModuleFileNameW`로 현재 실행 중인 프로그램의 전체 경로를 얻고, 여기에서 디렉터리 경로를 추출한다.  

![6](/assets/img/2025-11-24-1/6.png){: width="600" .left}
<br style="clear: both;">
- `SHGetKnownFolderPath`를 통해 %APPDATA% 경로를 획득한다.  
  - `SHGetKnownFolderPath`는 `rfid` 인자값을 통해 특정 경로를 찾는 함수이다. 설정된 `rfid` 값을 보고 `%APPDATA%` 경로를 지정하고 있음을 알 수 있다.  
    ![7](/assets/img/2025-11-24-1/7.png){: width="500" .left}  
    ![8](/assets/img/2025-11-24-1/8.png){: width="500" .left}  
    <br style="clear: both;">
- 현재 실행파일이 이미 %APPDATA% 내부라면 함수를 종료하고,  
다른 경로에서 실행중이라면 %APPDATA%\MicrosoftWindowsUpdate.exe 경로를 만들어 해당 위치로 자기 자신을 복제한다.  

![9](/assets/img/2025-11-24-1/9.png){: width="600" .left}  
<br style="clear: both;">
- `GetCommandLineW`로 현재 프로세스의 커맨드라인을 획득한다.
- `CreateProcessW`를 호출하여, 앞서 복제한 파일(%APPDATA%\MicrosoftWindowsUpdate.exe)을 동일한 커맨드라인으로 실행한다.
  - 이때 `CreateProcessW`의 6번째 인자(`dwCreationFlags`)가 0x80000000인데, 이는 콘솔 창 없이 실행하는 옵션이다.
  ![10](/assets/img/2025-11-24-1/10.png){: width="500" .left}  
<br style="clear: both;">

- `WaitForSingleObject`를 이용해 생성된 프로세스가 정상 실행하는지 3초 동안 확인한다. 반환값 258은 WAIT_TIMEOUT으로, 이를 통해 프로세스가 실행중인 상태인지를 판단하는 것이다.  
  ![11](/assets/img/2025-11-24-1/11.png){: width="300" .left}  
<br style="clear: both;">
- 프로세스가 정상 작동함을 확인하면 현재 프로세스와 스레드 핸들을 정리한다.

<br>

#### sub_4126B0
해당 함수는 다음 세 개의 하위 함수로 구성되며, 서비스 및 프로세스 종료와 안티디버깅 로직을 포함한다.  
  ![12](/assets/img/2025-11-24-1/12.png){: width="600" .left}  
<br style="clear: both;">

- 종료 대상 서비스에는 각종 백신, 백업 솔루션, 데이터베이스, 메일 및 웹 서버 관련 서비스가 포함된다.
    ![13](/assets/img/2025-11-24-1/13.png){: width="600" .left}  
<br style="clear: both;">  

- 종료 대상 프로세스는 두 가지 종류로 나눠 각각 다른 리스트로 저장한다.  
![14](/assets/img/2025-11-24-1/14.png){: width="600" .left}
![15](/assets/img/2025-11-24-1/15.png){: width="600" .left}  
<br style="clear: both;">
  - 한 리스트에는 리버싱 도구 및 디버거 등 분석 도구 관련 프로세스를, 다른 리스트에는 오피스 프로그램, 이메일, 브라우저 등의 일반 응용 프로그램 프로세스를 포함한다.
  - 이후 별도의 처리를 하기 위한 것으로, 분석 도구 프로세스의 경우에는 종료 이후 실행 파일 삭제까지 시도한다.
<br>

- 현재 프로세스 토큰에 디버깅 권한(`SeDebugPrivilege`)을 활성화한다. 이 권한을 활성화하면 다른 프로세스에 대한 접근 및 제어가 가능해진다.  
  ![16](/assets/img/2025-11-24-1/16.png){: width="600" .left}  
  <br style="clear: both;">
  1. `GetCurrentProcess` - 현재 프로세스 핸들 획득
  2. `OpenProcessToken` - 현재 프로세스의 액세스 토큰을 열기
  3. `LookupPrivilegeValueW`로 `SeDebugPrivilege`에 해당하는 LUID 값 조회
  4. `AdjustTokenPrivileges`를 통해 해당 권한 활성화  
    - 이때 구성되는 TOKEN_PRIVILEGES 구조체의 `Attributes` 값 2는 `SE_PRIVILEGE_ENABLED`(권한 활성화) 설정이다.  
- 디버거 감지 로직
  ![17](/assets/img/2025-11-24-1/17.png){: width="600" .left}  
  <br style="clear: both;">
  - 디버거를 감지하면 현재 실행파일을 새로운 프로세스로 재실행한다.
  - 디버거가 감지되지 않으면 4712121이라는 플래그를 설정하는데, 이는 이후 악성행위 로직의 실행 여부를 결정하는 검증 값으로 쓰인다.  
- 종료 대상 프로세스 처리
  ![_18](/assets/img/2025-11-24-1/_18.png){: width="600" .left}  
  <br style="clear: both;">
  - 프로세스 스냅샷을 통해 목록을 순회하면서, 위에서 나열한 대상 프로세스 목록과 비교하며 종료 로직을 수행한다.
  - 아까 프로세스 목록을 종류에 따라 두 리스트로 나눠 저장했었다. 분석 도구 관련 프로세스의 경우는 827791 플래그를 설정해 실행 파일 삭제까지 수행한다.
  ![_19](/assets/img/2025-11-24-1/_19.png){: width="600" .left}  
  <br style="clear: both;">
  - 두 번째 리스트에 담긴 프로세스들은 실행파일 플래그를 삭제해 프로세스 종료만 실행한다.
  ![_20](/assets/img/2025-11-24-1/_20.png){: width="600" .left}  
  <br style="clear: both;">
- 종료 대상 서비스 처리
  ![_21](/assets/img/2025-11-24-1/_21.png){: width="600" .left}  
  <br style="clear: both;">
  정의한 서비스 목록을 순회하며 각 서비스의 핸들을 열어 실행 상태를 확인하고, 실행 중인 경우 중지 명령을 전송한 뒤 일정 시간 대기하면서 상태를 반복 확인하여 서비스가 완전히 중지되도록 한다.
  - `OpenServiceA`: 서비스 핸들 열기
  - `QueryServiceStatusEx`: 서비스 현재 상태 조회
  - `ControlService`: 서비스에 제어 명령 전달 (1: SERVICE_CONTROL_STOP, 중지 요청)
  - `CloseServiceHandle`: 서비스 핸들 해제

<br>

#### sub_412740
![18](/assets/img/2025-11-24-1/18.png){: width="600" .left}  
<br style="clear: both;">
- `CreateToolhelp32Snapshot`으로 전체 프로세스 목록의 스냅샷을 생성하고,  
`Process32FirstW` / `Process32NextW`를 이용해 이를 열거하며 현재 PID를 찾는다.
![19](/assets/img/2025-11-24-1/19.png){: width="550" .left}  
<br style="clear: both;">
- PID로 현재 프로세스의 엔트리를 찾아서 부모 프로세스 ID(`th32ParentProcessID`)를 얻어서 `OpenProcess`로 부모 프로세스의 핸들을 획득한다.
  - 프로세스 엔트리 구조 (PROCESSENTRY32W 구조체)
  ```cpp
  typedef struct tagPROCESSENTRY32W {
    DWORD     dwSize;
    DWORD     cntUsage;
    DWORD     th32ProcessID;
    ULONG_PTR th32DefaultHeapID;
    DWORD     th32ModuleID;
    DWORD     cntThreads;
    DWORD     th32ParentProcessID;
    LONG      pcPriClassBase;
    DWORD     dwFlags;
    WCHAR     szExeFile[MAX_PATH];
  } PROCESSENTRY32W;
  ```  

<br>
![20](/assets/img/2025-11-24-1/20.png){: width="600" .left}  
<br style="clear: both;">
- K32GetModuleFileNameExW로 부모 프로세스의 전체 경로를 얻어와서, 이를 이용해 cmd 명령을 구성한다.
- 이때 부모 프로세스의 파일명이 "explorer.exe"인지 여부에 따라 다르게 처리한다.
  - 공통적으로 수행하는 동작
    1. cmd.exe를 실행하여 일정 시간 지연 후 부모 프로세스 실행파일 삭제 명령
      ```shell
      cmd.exe /c TIMEOUT /T 2 >NUL
      & START /b "" cmd /c DEL "<부모 경로>"
      & EXIT
      ```
    2. 부모 프로세스 강제 종료 (`TerminateProcess`)
    3. 부모 프로세스 실행파일 삭제 시도 (`DeleteFileW`)
  - 부모가 explorer.exe인 경우에는 현재 프로세스에 대한 삭제 로직이 추가된다.
    1. 현재 실행 파일을 삭제하는 명령어
      ```shell
      & DEL "<현재 exe 파일명>"
      ```
    2. 현재 프로세스 종료 (`ExitProcess`)

즉 사용자가 직접 실행한 프로세스를 P0, P0이 자가복제를 통해 생성한 자식 프로세스를 P1이라고 하면, 최종적으로 P1만 남기고 P0을 종료 및 삭제하는 설계이다.

