// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

/// @title 테스트용 USDC주소
/// @author 허청
/// @notice 테스트용 USDC주소 실제로는 이미 배포되어 있는 공식 USDC컨트랙트에 상호작용할 것임.
/// @dev 테스트용 USDC주소 실제로는 이미 배포되어 있는 공식 USDC컨트랙트에 상호작용할 것임.
contract USDC is ERC20{

    /// @notice 테스트용 USDC
    /// @dev ERC20을 상속함
    constructor() ERC20("USDC","USD") {

    }
    
    /// @notice 테스트용 USDC 초기 자금 민팅해서 테스트하기 위함
    /// @dev 테스트용 USDC 초기 자금 민팅해서 테스트하기 위함
    /// @param to 민팅 받을 주소
    function acquire(address to) external {
        _mint(to, 1e10);
    }

    function decimals() public view virtual override returns(uint8) {
        return 6;
    }
}
