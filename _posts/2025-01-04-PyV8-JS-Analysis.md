---
title: PyV8을 이용해 난독화된 JavaScript 악성코드 분석하기
author: east1otus
date: 2025-01-04 +0900
categories: [Reversing, Malware Analysis]
tags: [Reversing, Malware]
---
<br>

## 개요

전공 수업을 통해 PyV8을 이용해서 JavaScript 코드의 실행 흐름을 분석하는 기법을 배우게 되었다. 과제로 수행했던 난독화된 JavaScript 악성코드 분석 과정을 정리해보았다.

PyV8은 Google V8 자바스크립트 엔진을 Python에서 사용할 수 있도록 해 주는 라이브러리이다.

다만 PyV8은 JavaScript 코드의 실행만 담당할 뿐, WScript나 ActiveXObject 같은 외부 환경 객체는 기본적으로 포함되어 있지 않다. 따라서 이러한 객체를 사용하는 코드는 PyV8에서 실행하면, 해당 객체가 존재하지 않아 에러가 발생한다.

이때 오류 메시지를 기반으로 코드에서 사용되는 객체와 API를 Dummy 형태로 정의해 주면 실제 행위를 수행하지는 않으면서, 실행 흐름은 이어나갈 수 있다.

이 방법을 이용해서 난독화된 JavaScript의 동작을 분석하였다.

<br>

## PyV8 설치

다운로드 링크: [pyv8](https://code.google.com/archive/p/pyv8/downloads)

참고로 마지막 업데이트가 2012년 버전 1.0이다. 그리고 사용하기 위해서는 Python 2.7이 필요하다.

본 분석은 Windows 7 64bit 환경에서 PyV8-1.0-preview-r443.win32-py2.7 버전을 사용하였다.

PyV8을 설치하면 Python 2.7에서 임포트해 사용할 수 있다.
```python
import PyV8
```

<br>

## 분석 대상

정적 분석으로 동작을 파악하기 어렵게 난독화되어 있는 JavaScript 코드이다.  
![1](/assets/img/2025-01-04-1/1.png){: width="600" .left}  
<br style="clear: both;"><br>


## PyV8 기반 분석 코드 작성

먼저, 파일을 읽어와서 실행하는 기본 코드를 작성한다.

```python
import PyV8

ctx = PyV8.JSContext()
ctx.enter()

buf = open('malware.js', 'rb').read()
ctx.eval(buf)
```

실행을 하면 WScript 객체가 정의되지 않아 에러가 발생한다.  

![2](/assets/img/2025-01-04-1/2.png){: width="600" .left}  
<br style="clear: both;"><br>

따라서 해당 객체를 직접 정의해 주어야 한다.

```python
# coding: utf-8

import PyV8

class MyWScript(PyV8.JSClass):
    pass

class Global(PyV8.JSClass):
    WScript = MyWScript()

ctx = PyV8.JSContext(Global())
ctx.enter()

buf = open('malware.js', 'rb').read()
ctx.eval(buf)
```
- MyWScript라는 Dummy 클래스를 만들고, Global 객체에서 WScript = MyWScript()로 등록한다.
- 그리고 PyV8.JSContext(Global())를 통해 Global 객체를 JavaScript의 전역 객체로 지정하면, JavaScript 코드에서 WScript를 사용할 때 MyWScript 객체를 참조하게 된다.


이 상태에서 실행하면 이제 WScript.CreateObject 메서드가 없다는 에러가 발생한다.  

![3](/assets/img/2025-01-04-1/3.png){: width="600" .left}  
<br style="clear: both;"><br>

따라서 MyWScript 안에 CreateObject 메서드를 만들어 준다.
```python
class MyWScript(PyV8.JSClass):
    def CreateObject(self):
        print '[*] CreateObject'
```

그런데 전달된 인자 개수가 함수가 받는 인자 수와 맞지 않다는 에러가 난다.  

![4](/assets/img/2025-01-04-1/4.png){: width="600" .left}  
<br style="clear: both;">

- JavaScript 코드에서 `WScript.CreateObject("MSXML2.XMLHTTP")`가 호출되면서, 문자열 인자 하나가 전달되는 것으로 보인다.  
- PyV8에서는 객체 자신을 의미하는 `self`가 자동으로 첫 번째 인자로 추가된다.
- 즉 실제로는 `CreateObject(self, objid)` 형태로 총 2개의 인자가 전달되지만, 함수 정의가 `def CreateObject(self):`로 하나의 인자만 받도록 되어 있어 인자 수가 맞지 않은 것이다.  
<br>

따라서 다음과 같이 인자를 추가해준다.

```python
class MyWScript(PyV8.JSClass):a
    def CreateObject(self, objid):
        print '[*] CreateObject: ', objid
```

`CreateObject`가 제대로 호출되어 Dummy 코드 내에 만든 출력문이 잘 나오는 것을 볼 수 있다.  

![5](/assets/img/2025-01-04-1/5.png){: width="600" .left}  
<br style="clear: both;"><br>

이번엔 에러 메시지를 통해 CreateObject("WScript.Shell")을 통해 WScript.Shell 객체가 생성되고, 그 객체의 ExpandEnvironmentStrings 메서드가 호출되어야 한다는 것을 알 수 있다.
MyWScriptShell이라는 dummy 객체를 정의하여, CreateObject 함수에 "WScript.Shell"이 인자로 들어오면 해당 객체를 반환하게 만들었다.
그리고 MyScriptShell 클래스에 ExpandEnvironmentStrings 메서드를 정의해준다. 이번에도 (self 외) 인자가 한 개 들어가는 메서드여서 인자를 추가해 만들어주었다.

```python
class MyWScript(PyV8.JSClass):
    def CreateObject(self, objid):
        print '[*] CreateObject: ', objid
        if objid.lower() == 'wscript.shell':
            return MyWScriptShell()

class MyWScriptShell(PyV8.JSClass):
    def ExpandEnvironmentStrings(self, n):
        print '[*] WScriptShell.ExpandEnvironmentStrings: ', n
        return n
```

![7](/assets/img/2025-01-04-1/7.png){: width="600" .left}  
<br style="clear: both;"><br>

그런데 이후 객체 생성만 하고 별도의 에러 메시지 없이 실행이 중단된다. 이는 내부 분기 조건 또는 예외 처리 로직 등에 의해 프로그램이 종료된 것으로 볼 수 있다. 흐름을 이어나가기 위해서 코드를 직접 살펴봐야 했다.  

![8](/assets/img/2025-01-04-1/8.png){: width="600" .left}  
<br style="clear: both;">

난독화되어 파악이 어렵긴 하지만, 맨 마지막 부분에 `eval` 함수로 뭔가를 실행하는 것을 볼 수 있다. `eval` 함수는 인자로 들어가는 문자열을 코드로 실행하기 때문에 악용되기 쉬운 함수이다.

`eval`에 전달되는 인자를 출력할 수 있다면 어떤 코드가 실행되는 건지 확인이 가능할 텐데, `eval`은 V8 내장 함수이기 때문에 Dummy API 형태로 오버라이딩하기는 어렵다. 이때 `eval`을 `alert`로 수정하고 `alert`를 Dummy 함수로 정의해주어 우회하는 방법이 있다.  

![9](/assets/img/2025-01-04-1/9.png){: width="600" .left}  
<br style="clear: both;">

이렇게 바꿔주고 `alert`를 `Global` 객체 내에 Dummy API로 만들어 주었다.

```python
class Global(PyV8.JSClass):
    WScript = MyWScript()
    def alert(self, a1):
        print a1
```

이러면 원래 `eval()`을 통해 실행되는 코드가 출력되며 난독화되어 있던 코드가 모두 해석된 형태로 드러난다.  

![10](/assets/img/2025-01-04-1/10.png){: width="600" .left}  
<br style="clear: both;">  

이 코드를 deobf.js로 저장하여 분석 대상으로 교체해주었다. 

![11](/assets/img/2025-01-04-1/11.png){: width="600" .left}  
<br style="clear: both;">  

코드를 보면, 예외처리가 되어 프로그램이 종료되었음을 파악할 수 있다.

예외 로직에 걸려 종료되지 않도록 다음과 같이 try~catch 문을 주석처리 해주었다.  

![12](/assets/img/2025-01-04-1/12.png){: width="600" .left}  
<br style="clear: both;">

이후엔 나머지 필요한 객체들과 함수들을 적절히 만들어 실행 흐름을 이어가주면 된다.

완성된 코드와 분석 결과는 다음과 같다.

```python
# coding: utf-8

import PyV8

class MyWScript(PyV8.JSClass):
    def CreateObject(self, objid):
        print '[*] CreateObject: ', objid
        if objid.lower() == 'wscript.shell':
            return MyWScriptShell()
        elif objid.lower() == 'msxml2.xmlhttp':
            return MyXMLHTTP()
        elif objid.lower() == 'adodb.stream':
            return MyADODBStream()

class MyWScriptShell(PyV8.JSClass):
    def ExpandEnvironmentStrings(self, n):
        print '[*] WScriptShell.ExpandEnvironmentStrings: ', n
        return n
    
    def Run(self, Filename, a, b):
        print '[*] WScriptShell.Run: ', Filename

class MyXMLHTTP(PyV8.JSClass): # xo
    status = 200
    def open(self, a, b, c):
        print '[*] XMLHTTP.open'
        print '    [-]:', a
        print '    [-]:', b
        print '    [-]:', c
        
    def send(self):
        print '[*] XMLHTTP.send'


class MyADODBStream(PyV8.JSClass): # xa
    size = 2000
    def open(self):
        print '[*] ADODBStream.open'
        
    def close(self):
        print '[*] ADODBStream.close'
        
    def write(self, msg):
        print '[*] ADODBStream.write', msg
        
    def saveToFile(self, Filename, SaveOptions):
        print '[*] ADODBStream.SaveToFile:', Filename

class Global(PyV8.JSClass):
    WScript = MyWScript()
    def alert(self, a1):
        print a1

ctx = PyV8.JSContext(Global())
ctx.enter()

buf = open('malware_readable.js_', 'rb').read()
ctx.eval(buf)
```

![14](/assets/img/2025-01-04-1/14.png){: width="600" .left}  
<br style="clear: both;">


결과 출력을 통해 해당 악성코드는 외부 서버에서 실행 파일을 다운로드한 뒤 %TEMP% 경로에 저장하고, 이를 실행하는 동작을 반복하는 로직임을 확인할 수 있다.  

<br>

이렇게 PyV8을 이용해 난독화된 JavaScript 코드를 해석하고, 실제 행위를 수행하지 않으면서 실행 흐름을 분석할 수 있었다.

PyV8이 더 이상 유지보수되지 않아 Python3 이상에서 사용할 수 없는 점은 아쉽지만, JavaScript 분석에 유용한 도구인 것 같다. 최신 환경에서도 이런 방식으로 JS 악성코드를 동적 분석할 수 있는 방법이 있는지 알아보면 좋을 것 같다.