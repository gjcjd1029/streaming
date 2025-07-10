# bbungfluid
[Git Source](https://github.com/rex0x1b/bbotest/blob/952245d2f0f964269ce96a185bc1003056f1ad8f/src/userPayment.sol)

**Author:**
Cheong

Users can pay when they really use streaming.

*Manage users to interact streaming.*


## State Variables
### users
Struct USERInfo of each address

*USERInfo log of each user*


```solidity
mapping(address => USERInfo) public users;
```


### owner
The address of the owner


```solidity
address public owner;
```


### ownerBalance
Balance of profit


```solidity
uint256 public ownerBalance;
```


### totalBalance
Balance that users called deposit function.


```solidity
uint256 public totalBalance;
```


### secondFee
Fee per second


```solidity
uint256 public secondFee;
```


### upscailing
upscailing that support fee calculation.


```solidity
uint256 public upscailing;
```


### usdc
The address of the USDC.


```solidity
USDC public usdc;
```


## Functions
### constructor

Set owner address, usdc address.

*The address to set as the owner.*


```solidity
constructor(address _owner, address _usdc);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_owner`|`address`|The address to set as a owner.|
|`_usdc`|`address`|The address of the USDC token contract.|


### onlyOwner

Only callable by the owner

*Owner can set socondFee and request profit*


```solidity
modifier onlyOwner();
```

### startStream

Start stream.

*Minimum charge 5min*


```solidity
function startStream(address user, uint256 timeoutMin) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`user`|`address`|User address|
|`timeoutMin`|`uint256`|Time user want to shut down.|


### endStream

Shut down stream.

*User's charge decrease based on usage, with a minimum charge of five.*


```solidity
function endStream(address user) external;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`user`|`address`|User address|


### deposit

Deposit USDC for charge.

*Need USDC.approve and call this.*


```solidity
function deposit(address user, uint256 amount) public;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`user`|`address`|User address|
|`amount`|`uint256`|Deposit balance.|


### refund

Refund USDC in charge.


```solidity
function refund(address user, uint256 amount) public;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`user`|`address`|User address|
|`amount`|`uint256`|Refund balance.|


### viewRemainStreemTime

View remain streem time.


```solidity
function viewRemainStreemTime(address user) public view returns (uint256);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`user`|`address`|The address of user|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`uint256`|uint256 Cal charge / secondFee|


### viewUSERInfo

View USERInfo struct of each user.


```solidity
function viewUSERInfo(address user) public view returns (USERInfo memory);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`user`|`address`|The address of user|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`USERInfo`|USERInfo Return user information struct.|


### setSecondFee

Set fee per second.


```solidity
function setSecondFee(uint256 hour, uint256 dollar) public onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`hour`|`uint256`|Hourly basis|
|`dollar`|`uint256`|1e6 == 1 dollar|


### setOwner

Set owner.

*Only callable by the owner*


```solidity
function setOwner(address newOwner) external onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`newOwner`|`address`|The updated owner address|


### withdrawOwner

Withdraw contract's profit.

*Withdraw contract's profit.*


```solidity
function withdrawOwner(address to, uint256 amount) external onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`to`|`address`|The address that will receive the USDC.|
|`amount`|`uint256`|The amount to transfer|


### rescueLockMoney

Withdraw contract's balance.

*If users use directly transfer function, refund currency.*


```solidity
function rescueLockMoney(address to, uint256 amount) external onlyOwner;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`to`|`address`|The address that will receive the USDC.|
|`amount`|`uint256`|The amount to transfer|


### _setTimeout

Emit to interact with frontend.

*Interaction will be disabled via the frontend after a specified number of minutes.*


```solidity
function _setTimeout(address user, uint256 min) internal;
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`user`|`address`|The address of user|
|`min`|`uint256`|It is in minutes.|


## Events
### forcedShutdown
Forced shut down.

*Captured by the frontend, which then triggeres a response.*


```solidity
event forcedShutdown(address user, uint256 remainSecond);
```

**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`user`|`address`|The address of the user|
|`remainSecond`|`uint256`|The remaining time in seconds before shutdown.|

## Structs
### USERInfo
User profile log.


```solidity
struct USERInfo {
    address user;
    uint256 charge;
    timeLog time;
}
```

### timeLog
Time log.


```solidity
struct timeLog {
    uint256 lastStart;
    uint256 lastEnd;
}
```

