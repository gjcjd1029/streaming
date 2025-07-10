# USDC
[Git Source](https://github.com/rex0x1b/bbotest/blob/952245d2f0f964269ce96a185bc1003056f1ad8f/src/mocUSDC.sol)

**Inherits:**
ERC20

**Author:**
허청

테스트용 USDC주소 실제로는 이미 배포되어 있는 공식 USDC컨트랙트에 상호작용할 것임.

*테스트용 USDC주소 실제로는 이미 배포되어 있는 공식 USDC컨트랙트에 상호작용할 것임.*


## Functions
### constructor

테스트용 USDC

*ERC20을 상속함*


```solidity
constructor() ERC20("USDC", "USD");
```

### acquire

테스트용 USDC 초기 자금 민팅해서 테스트하기 위함

*테스트용 USDC 초기 자금 민팅해서 테스트하기 위함*


```solidity
function acquire(address to) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`to`|`address`|민팅 받을 주소|


