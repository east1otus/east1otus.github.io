---
title: Keylogger 악성코드 분석
author: east1otus
date: 2025-02-20 +0900
categories: [Reversing, Malware Analysis]
tags: [Reversing, Malware, Keylogger]
---

> 파일 정보  
SHA-256: 

## 분석 도구
- CFF Explorer
- IDA Freeware
- System Explorer

## 정적 분석
**패킹 여부 확인 (CFF Explorer로 다시 찍기)**  
<br>
**WinMain 함수 분석**  
  ![test](/assets/img/2025-02-20-1/2.png){: width="400"}  

  1. `GetSystemTime`으로 현재 시스템 시간을 가져와 buffer에 저장
  2. `SHGetSpecialFolderPathA` 함수로 경로 지정
      ```C++
      BOOL SHGetSpecialFolderPathA(
                HWND  hwnd,
        [out]   LPSTR pszPath,
        [in]    int   csidl,
        [in]    BOOL  fCreate
      );
      ```
      - `SHGetSpecialFolderPathA`는 CSIDL 인자로 식별되는 특수 폴더의 경로를 검색하는 함수이다.
        - [CSIDL](https://learn.microsoft.com/ko-kr/windows/win32/shell/csidl) : Windows에서 특수 폴더를 식별하기 위해 정의된 상수
        - 28(0x1C) = CSIDL_LOCAL_APPDATA (참고: [CSIDL values](https://tarma.com/support/im9/using/symbols/functions/csidls.htm))  
      `%LocalAppData%` 환경 변수와 동일하며, 일반적으로 `C:\Users\<사용자명>\AppData\Local`  
  3. 위에서 얻은 경로에 `\ntUserLang.ini`라는 파일명을 결합
  <br><br>
  4. `LoadLibraryA`로 `winmsvc.dll` 라이브러리를 동적 로드  
    - Windows에 기본 DLL도 아니고, 공개된 정보도 없는 이름이라 공격자가 제작한 DLL로 추정  
    <br><br>
  ![test](/assets/img/2025-02-20-1/3.png){: width="400"}
  4. DLL 로드에 성공하면, 해당 라이브러리에서 `GetProcAddress`로 `login`과 `uploadfile` 함수의 주소를 획득한다.
  5. 함수 주소 획득에 성공하면, 위에서 만들었던 파일 경로(`%LocalAppData%\ntUserLang.ini`)를 연다.  
    - 여기서 `CreateFileA`의 두 번째 인자로 들어가는 `0x80000000` 상수 값은 GENERIC_READ(읽기 권한)을 뜻한다.
  6. `login("sally3152@daum.net", "SurDoc2025")`와 `uploadFile(FileName, Buffer)` 함수를 각각 성공할 때까지 반복 호출한다.  
    - DLL 파일이 없어 직접 분석은 하지 못하나, 함수명과 인자로 유추했을 때 특정 사이트에 로그인하고 파일을 업로드하는 기능으로 보임
![test](/assets/img/2025-02-20-1/4.jpg){: width="400"}
  7. `sub_401000` 함수에 `uploadfile` 함수 주소와, 현재 시간을 문자열로 변환한 값을 인자로 전달
  8. 512바이트의 버퍼를 초기화한 후 `sub_4012BC`호출

<br><br>
**sub_401000 함수**  
  ![test](/assets/img/2025-02-20-1/5.jpg){: width="400"}
  - 인자로 받은 문자열을 파일(`ntUserLang.ini`)에 쓰기
  - 즉 아까 전달받은 인자를 생각해 보면, 시간과 구분선을 쓰기 위한 함수이다.
<br><br>
**sub_4012BC 함수**
  ![test](/assets/img/2025-02-20-1/6.jpg){: width="400"}
  - `SetWindowsHookExA` 함수를 이용해 키보드 입력 이벤트 모니터링
    ```C++
    HHOOK SetWindowsHookExA(
      [in] int       idHook,
      [in] HOOKPROC  lpfn,
      [in] HINSTANCE hmod,
      [in] DWORD     dwThreadId
    );
    ```
    - 첫 번째 인자는 설치할 후크 종류를 지정하는 값으로, WH_KEYBOARD_LL(13)으로 설정할 경우 저수준 키보드 이벤트를 감시한다.  
      ![test](/assets/img/2025-02-20-1/7.jpg){: width="400"}
  ![test](/assets/img/2025-02-20-1/8.jpg){: width="400"}
  - `GetMessageA`: 메시지 큐에서 메시지를 가져와 저장
  - `TranslateMessage`: 메시지를 텍스트로 변환
  - `DispatchMessageA`: 윈도우 프로시저에 메시지 전달


  ## 동적 분석
  System Explorer 도구의 Snapshot 기능을 활용해 실제 행위를 확인하였다.  
  해당 기능은 특정 시점의 시스템의 파일 및 레지스트리 상태를 저장할 수 있는 기능이다.  
  <br><br>
  먼저 악성코드 실행 전, 후에 각각 Shanpshot을 생성했다.  
  ![test](/assets/img/2025-02-20-1/9.jpg){: width="400"}
  두 스냅샷을 체크하여 Compare Shapshots을 누르면 두 상태를 한눈에 비교할 수 있다.  
  ![test](/assets/img/2025-02-20-1/10.jpg){: width="400"}
  ntUserLang.ini 파일이 앞서 봤던 %AppDataLocal% 경로에 생성된 것을 볼 수 있다.  
  ![test](/assets/img/2025-02-20-1/10.jpg){: width="400"}
  해당 파일에 실제로 키보드 입력이 로깅되는 것을 확인할 수 있다.