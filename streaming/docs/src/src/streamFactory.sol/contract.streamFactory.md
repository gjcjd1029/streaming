# streamFactory
[Git Source](https://github.com/rex0x1b/bbotest/blob/952245d2f0f964269ce96a185bc1003056f1ad8f/src/streamFactory.sol)

**Author:**
Cheong

Manage official company certification, support to deploy Userpayment.

*UserPayment Factory*


## State Variables
### owner
Owner address


```solidity
address public owner;
```


### companies
Detail of each company


```solidity
mapping(address company => companyDetail) public companies;
```


## Functions
### constructor

Set owner address

*Owner confirm official company certification.*


```solidity
constructor(address _owner);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`_owner`|`address`|Interact with frontend and Call register function.|


### onlyOwner

Only callable by the owner

*This requires careful management as it is tightly coupled with the frontend contract.*


```solidity
modifier onlyOwner();
```

### register

Acquire official company certification via the frontend, enter details and deploy bbungfluid contract (owner only).


```solidity
function register(address company, bytes memory cid, string memory name, address _usdc)
    external
    onlyOwner
    returns (address);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`company`|`address`|Company address|
|`cid`|`bytes`|IPFS hash|
|`name`|`string`|Company name|
|`_usdc`|`address`|USDC address|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`address`|fluid New bbungfluid contract address|


### viewCompanyDetail

View compnayDetail struct of each company.


```solidity
function viewCompanyDetail(address company) public view returns (companyDetail memory);
```
**Parameters**

|Name|Type|Description|
|----|----|-----------|
|`company`|`address`|Company address|

**Returns**

|Name|Type|Description|
|----|----|-----------|
|`<none>`|`companyDetail`|companyDetail Show struct companyDetail.|


## Structs
### companyDetail
*Company detail struct*


```solidity
struct companyDetail {
    bytes cid;
    string name;
    address bbungfluid;
}
```

