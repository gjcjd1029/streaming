        // SPDX-License-Identifier: UNLICENSED
    pragma solidity ^0.8.13;

    import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
    import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
    import "../src/mocUSDC.sol";
    import {console} from "forge-std/Test.sol";

    /// @title Streaming subscribe system
    /// @author Cheong
    /// @notice Users can pay when they really use streaming.
    /// @dev Manage users to interact streaming.
    contract bbungfluid {

        using SafeERC20 for IERC20;

        /// @notice User profile log.
        struct USERInfo {
            address user;   // User address
            uint256 charge; // User's total balance
            timeLog time;   // Time log
        }

        /// @notice Time log.
        struct timeLog {
            uint256 lastStart;  // Last start time
            uint256 lastEnd;    // Last end time
        }
        
        /// @notice Struct USERInfo of each address
        /// @dev USERInfo log of each user
        mapping(address => USERInfo) public users;

        /// @notice The address of the owner
        address public owner;

        /// @notice Balance of profit
        uint256 public ownerBalance;

        /// @notice Balance that users called deposit function.
        uint256 public totalBalance;

        /// @notice Fee per second
        uint256 public secondFee;

        /// @notice upscailing that support fee calculation.
        uint256 public upscailing;

        /// @notice The address of the USDC.
        USDC public usdc;
        
        /// @notice Forced shut down.
        /// @dev Captured by the frontend, which then triggeres a response.
        /// @param user The address of the user
        /// @param remainSecond The remaining time in seconds before shutdown.
        event forcedShutdown(address user, uint256 remainSecond);

        /// @notice Set owner address, usdc address.
        /// @dev The address to set as the owner.
        /// @param _owner The address to set as a owner.
        /// @param _usdc The address of the USDC token contract.
        constructor(address _owner, address _usdc) {
            owner = _owner;
            usdc = USDC(_usdc);
            upscailing = 1e10;
        }

        /// @notice Only callable by the owner
        /// @dev Owner can set socondFee and request profit
        modifier onlyOwner {
            require(msg.sender == owner, "Not owner");
        
            _;
        }

        /// @notice Start stream.
        /// @dev Minimum charge 5min
        /// @param user User address
        /// @param timeoutMin Time user want to shut down.
        function startStream(address user, uint256 timeoutMin) external {
            require(msg.sender == user, "Not user");
            require(users[user].charge >= secondFee * 60 * 5 / upscailing, "Minimum 10 min");
        
            if(timeoutMin != 0) _setTimeout(user, timeoutMin);
            users[user].time.lastStart = block.timestamp;
            
            emit forcedShutdown(user, viewRemainStreamTime(user));
        }

        /// @notice Shut down stream.
        /// @dev User's charge decrease based on usage, with a minimum charge of five.
        /// @param user User address
        function endStream(address user) external {
            require(msg.sender == user || msg.sender == owner, "Not user");
            require(block.timestamp > users[user].time.lastStart, "Too short time");        
            
            users[user].time.lastEnd = block.timestamp;

            if(users[user].time.lastEnd - users[user].time.lastStart <= 60 * 5) {
                users[user].charge -= secondFee * 60 * 5 / upscailing;
                totalBalance -= secondFee * 60 * 5 / upscailing;
                ownerBalance += secondFee * 60 * 5 / upscailing;
            } else {
                users[user].charge -= secondFee * (users[user].time.lastEnd - users[user].time.lastStart) / upscailing;
                totalBalance -= secondFee * (users[user].time.lastEnd - users[user].time.lastStart) / upscailing;
                ownerBalance += secondFee * (users[user].time.lastEnd - users[user].time.lastStart) / upscailing;
            }    
        }

        /// @notice Deposit USDC for charge.
        /// @dev Need USDC.approve and call this.
        /// @param user User address
        /// @param amount Deposit balance.
        function deposit(address user, uint256 amount) public {
            require(msg.sender == user, "Check user");
            require(amount >= 1e6, "Minimum 1 dollar");
            
            IERC20(usdc).safeTransferFrom(msg.sender, address(this), amount);
            users[user].user = user;
            users[user].charge += amount;
            totalBalance += amount;
        }

        /// @notice Refund USDC in charge.
        /// @param user User address
        /// @param amount Refund balance.
        function refund(address user, uint256 amount) public {
            require(msg.sender == user, "Check user");
            require(amount <= users[user].charge, "Insufficient balance");
            require(users[user].time.lastStart < users[user].time.lastEnd, "On streaming");

            users[user].charge -= amount;
            totalBalance -= amount;      

            IERC20(usdc).safeTransfer(user, amount);
        }

        // --------------------------------------------------------------------------------------

        /// @notice View remain streem time.
        /// @param user The address of user
        /// @return uint256 Cal charge / secondFee 
        function viewRemainStreamTime(address user) public view returns(uint256){
            return users[user].charge * upscailing / secondFee ;
        }

        /// @notice View USERInfo struct of each user.
        /// @param user The address of user
        /// @return USERInfo Return user information struct.
        function viewUSERInfo(address user) public view returns(USERInfo memory){
            return users[user];
        }

        /// @notice Set fee per second.
        /// @param hour Hourly basis
        /// @param dollar 1e6 == 1 dollar
        function setSecondFee(uint256 hour, uint256 dollar) public onlyOwner {
            require(hour <= 100, "Less than 100");
            if(dollar == 0) secondFee = 0;
            if(dollar >= 1e6) { // USDC decimal 1e6
                secondFee = dollar * upscailing / (hour * 60 * 60) ;
            }
        }

        /// @notice Set owner.
        /// @dev Only callable by the owner
        /// @param newOwner The updated owner address
        function setOwner(address newOwner) external onlyOwner {
            owner = newOwner;
        }    

        /// @notice Withdraw contract's profit.
        /// @dev Withdraw contract's profit.
        /// @param to The address that will receive the USDC.
        /// @param amount The amount to transfer
        function withdrawOwner(address to, uint256 amount) external onlyOwner {
            require(amount < ownerBalance, "Too much amount");
            IERC20(usdc).safeTransfer(to, amount);
        }

        /// @notice Withdraw contract's balance.
        /// @dev If users use directly transfer function, refund currency.
        /// @param to The address that will receive the USDC.
        /// @param amount The amount to transfer
        function rescueLockMoney(address to, uint256 amount) external onlyOwner {
            require(amount <= usdc.balanceOf(address(this)) - totalBalance, "Not owner money");
            IERC20(usdc).safeTransfer(to, amount);
        }

        /// @notice Emit to interact with frontend.
        /// @dev Interaction will be disabled via the frontend after a specified number of minutes.
        /// @param user The address of user
        /// @param min It is in minutes.
        function _setTimeout(address user, uint256 min) internal {
            emit forcedShutdown(user, min * 60);
        }    
    }

