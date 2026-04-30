---
title: PyV8을 이용해 난독화된 JavaScript 악성코드 분석하기
author: east1otus
date: 2025-01-04 +0900
categories: [Reversing, Malware Analysis]
tags: [Reversing, Malware]
---
<br>

전공 수업을 통해 PyV8을 이용해서 JavaScript 코드의 실행 흐름을 분석하는 기법을 배우게 되었다. 과제로 수행했던 난독화된 JavaScript 악성코드 분석 과정을 정리해보았다.

PyV8은 Google V8 자바스크립트 엔진을 Python에서 사용할 수 있도록 해 주는 라이브러리이다.

다만 PyV8은 JavaScript 코드의 실행만 담당할 뿐, WScript나 ActiveXObject 같은 외부 환경 객체는 기본적으로 포함되어 있지 않다. 따라서 이러한 객체를 사용하는 코드는 PyV8에서 실행하면, 해당 객체가 존재하지 않아 에러가 발생한다.

이때 오류 메시지를 기반으로 코드에서 사용되는 객체와 API를 Dummy 형태로 정의해 주면 실제 행위를 수행하지는 않으면서, 실행 흐름은 이어나갈 수 있다.

이 방법을 이용해서 난독화된 JavaScript의 동작을 분석하였다.


---

먼저, 파일을 읽어와서 실행하는 기본 코드를 작성한다.

```python
import PyV8

ctx = PyV8.JSContext()
ctx.enter()

buf = open('malware.js', 'rb').read()
ctx.eval(buf)
```

실행을 하면 WScript 객체가 정의되지 않아 에러가 발생한다. 

![1](/assets/img/2025-01-04-1/1.png){: width="600" .left}  
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

![2](/assets/img/2025-01-04-1/2.png){: width="600" .left}  
<br style="clear: both;"><br>

따라서 MyWScript 안에 CreateObject 메서드를 만들어 준다.
```python
class MyWScript(PyV8.JSClass):
    def CreateObject(self):
        print '[*] CreateObject'
```

그런데 전달된 인자 개수가 함수가 받는 인자 수와 맞지 않다는 에러가 난다.
![3](/assets/img/2025-01-04-1/3.png){: width="600" .left}  
<br style="clear: both;"><br>

- JavaScript 코드에서 `WScript.CreateObject("MSXML2.XMLHTTP")`가 호출되면서, 문자열 인자 하나가 전달되는 것으로 보인다.  
- PyV8에서는 객체 자신을 의미하는 `self`가 자동으로 첫 번째 인자로 추가된다.
- 즉 실제로는 `CreateObject(self, objid)` 형태로 총 2개의 인자가 전달되지만, 함수 정의가 `def CreateObject(self):`로 하나의 인자만 받도록 되어 있어 인자 수가 맞지 않은 것이다.

따라서 다음과 같이 인자를 추가해준다.
```python
class MyWScript(PyV8.JSClass):a
    def CreateObject(self, objid):
        print '[*] CreateObject: ', objid
```

`CreateObject`가 제대로 호출되어 Dummy 코드 내에 만든 출력문이 잘 나오는 것을 볼 수 있다.
![4](/assets/img/2025-01-04-1/4.png){: width="600" .left}  
<br style="clear: both;"><br>

이번엔 WScript.Shell 객체의 ExpandEnvironmentStrings 메서드를 호출할 수 없다는 에러메시지이다.
다음과 같이 MyScriptShell 클래스와 그 내부의 ExpandEnvironmentStrings 메서드를 만들어준다. 이번에도 (self 외) 인자가 한 개 들어가는 메서드여서 인자를 추가해 만들어주었다.

```python
class MyWScriptShell(PyV8.JSClass):
    def ExpandEnvironmentStrings(self, n):
        print '[*] ExpandEnvironmentStrings: ', x
```

## 작성중....