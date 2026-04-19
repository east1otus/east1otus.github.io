---
title: Raw 디스크 이미지 VM으로 부팅하기
author: east1otus
date: 2025-04-18 16:32:00 +0900
categories: [Digital Forensics, Tips]
tags: [Tips]
---


## 1. Raw 이미지를 VMDK로 변환
Raw 디스크 이미지는 디스크 내용을 그대로 덤프한 파일로, .raw, .img, .dd, .001 등의 확장자를 가진다.  
이러한 이미지는 qemu-img를 사용해 다음과 같이 VMDK 형식으로 변환할 수 있다.

```bash
qemu-img convert -p -f raw -O vmdk <input.001> <output.vmdk>
```  

- `-f raw`: 입력 파일 포맷
- `-O vmdk`: 출력 포맷
- `-p`: 진행률 표시

변환이 완료되면 .vmdk 파일이 생성된다.

## 2. 가상 머신 생성 (VMware)
1. Create a New Virtual Machine  
  ![test](/assets/img/2026-04-18-1/1.png){: width="400"}
  <br><br>
2. Typical (recommended)로 진행  
  ![test](/assets/img/2026-04-18-1/2.png){: width="400"}
  <br><br>
3. I will install the operating system later(운영체제 나중에 설치) 옵션 선택  
  ![test](/assets/img/2026-04-18-1/3.png){: width="400"}
  <br><br>    
4. 디스크 이미지에 맞는 운영체제 선택  
  ![test](/assets/img/2026-04-18-1/4.png){: width="400"}
  <br><br>   
5. VM 이름을 변환한 vmdk 파일명과 동일하게 설정  
  ![test](/assets/img/2026-04-18-1/5.png){: width="400"}
  <br><br>
6. 나머지 알아서 설정  
  ![test](/assets/img/2026-04-18-1/6.png){: width="400"}  
  ⚠️ VM 생성 후 **바로 부팅하지 말 것!**

## 3. 디스크 교체
1. VM 부팅하지 않은 상태에서, 생성한 VM 폴더로 이동
  <br><br>
2. 원래 있던 vmdk를, 앞에서 직접 변환한 vmdk로 교체  
  ![test](/assets/img/2026-04-18-1/7.png){: width="400"}
  <br><br>
3. 이제 VMware에서 VM을 실행하면 변환한 디스크 이미지로 부팅된다.