// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./userPayment.sol";
import {console} from "forge-std/Test.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title UserPayment Factory
/// @author Cheong
/// @notice Manage official company certification, support to deploy Userpayment.
/// @dev UserPayment Factory
contract streamFactory {
    
    using SafeERC20 for IERC20;

    /// @dev Company detail struct
    struct companyDetail {
        bytes cid;          // ipfs hash
        string name;        // compnay name
        address bbungfluid; // bbungfluid contract address
    }

    /// @notice Owner address
    address public owner;

    /// @notice Detail of each company
    mapping(address company => companyDetail) public companies;
    
    /// @notice Set owner address
    /// @dev Owner confirm official company certification.
    /// @param _owner Interact with frontend and Call register function.
    constructor(address _owner) {
        owner = _owner;
    }

    /// @notice Only callable by the owner
    /// @dev This requires careful management as it is tightly coupled with the frontend contract.
    modifier onlyOwner {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// @notice Acquire official company certification via the frontend, enter details and deploy bbungfluid contract (owner only).
    /// @param company Company address
    /// @param cid IPFS hash
    /// @param name Company name
    /// @param _usdc USDC address
    /// @return fluid New bbungfluid contract address
    function register(address company, bytes memory cid, string memory name, address _usdc) external onlyOwner returns(address) {
        bbungfluid fluid = new bbungfluid(company, _usdc);
        companies[company] = companyDetail(cid, name, address(fluid));

        return address(fluid);
    }

    /// @notice View compnayDetail struct of each company.
    /// @param company Company address
    /// @return companyDetail Show struct companyDetail.
    function viewCompanyDetail(address company) public view returns(companyDetail memory) {
        return companies[company];
    }
}