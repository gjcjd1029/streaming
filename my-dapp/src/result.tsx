import { ethers, BrowserProvider, Contract } from 'ethers';
import { useEffect, useState, useCallback } from 'react';
import UserPaymentJson from "../public/userPayment.json";
import './index.css';

const STREAM_ABI = UserPaymentJson.abi;
const STREAM_ADDRESS = "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be";

async function initProvider(): Promise<BrowserProvider | null> {
    if(window.ethereum) {
        console.log("메타마스크 연결");
        return new BrowserProvider(window.ethereum);
    } else {
        console.log("메타마스크 연결 실패");
        return null;
    }
}

interface USERdetail {
    user: string;        // address는 0x... 형태의 문자열로 표현되므로 string이 맞습니다.
    charge: bigint;       // uint256은 BigInt로 받아야 합니다.
    time: {
        lastStart: bigint;  // uint256 timestamp도 BigInt로
        lastEnd: bigint;    // uint256 timestamp도 BigInt로
    }
}

function StreamingApp() {
    // variables
    const [provider, setProvider] = useState<BrowserProvider | null>(null); 
    const [account, setAccount] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    const [streamReadContract, setStreamReadContract] = useState<Contract | null>(null);
    const [streamWriteContract, setStreamWriteContract] = useState<Contract | null>(null);

    const [ownerAddress, setOwnerAddress] = useState<string>('');
    const [userAddress, setUserAddress] = useState<string>('');
    const [userInfo, setUserInfo] = useState<USERdetail>({
        user: '',        
        charge: 0n,       
        time: {lastStart: 0n, lastEnd: 0n}
    });
    const [timeOutMin, setTimeOutMin] = useState<number>(0);
    const [sendAmount, setSendAmount] = useState<number>(0);
    const [refundAmount, setRefundAmount] = useState<number>(0);
    const [remainTime, setRemainTime] = useState<number>(0);
    const [newOwner, setNewOwner] = useState<string>('');
    const [sendTo, setSendTo] = useState<string>('');

    // function
    const fetchUserInfo = useCallback(async() => {
        if(!streamReadContract) {
            console.log("패치 인포 에러", streamReadContract);
            return;
        }
        try {
            const streamData = await streamReadContract.users(userAddress);
            setUserInfo({
                user: streamData.user,        
                charge: BigInt(streamData.charge.toString()),       
                time: {
                    lastStart: BigInt(streamData.lastStart.toString()),
                    lastEnd: BigInt(streamData.lastEnd.toString());
                }
            });
        } catch(error) {
            console.error("fetchUserInfo Error:", error);
        }
    }, [streamReadContract, userAddress]);


    const loadStartStream = useCallback(async() => {
        if(!streamWriteContract || !userAddress) return;

        try {
            const tx = await streamWriteContract.startStream(
                userAddress,
                timeOutMin
            )
            await tx.wait();
            fetchUserInfo()
            setUserAddress('');
            setTimeOutMin(0);
        } catch(error) {
            console.log("Start stream 실패:", error);
        }
    }, [streamWriteContract, userAddress, timeOutMin, fetchUserInfo]);

    const loadEndStream = useCallback(async() => {
        if(!streamWriteContract || !userAddress) return;

        try {
            const tx = await streamWriteContract.endStream(
                userAddress
            )
            await tx.wait();
            fetchUserInfo()
            setUserAddress('');
            console.log("트랜잭션 전송(End Stream)", tx.hash);
        } catch(error) {
            console.log("End stream 실패:", error);
        }
    }, [streamWriteContract, userAddress, fetchUserInfo]);


    const loadDeposit = useCallback(async() => {
        if(!streamWriteContract || !userAddress || !sendAmount) return;

        try {
            const tx = await streamWriteContract.deposit(
                userAddress,
                sendAmount
            )
            fetchUserInfo()
            console.log("트랜잭션 전송(Deposit)", tx.hash);
            await tx.wait();
        } catch(error) {
            console.log("Deposit 실패:", error);
        }
    }, [streamWriteContract, userAddress, sendAmount, fetchUserInfo]);


    const loadRefund = useCallback(async() => {
        if(!streamWriteContract || !userAddress || !refundAmount) return;

        try {
            const tx = await streamWriteContract.refund(
                userAddress,
                refundAmount
            )
            fetchUserInfo()
            setUserAddress('');
            setRefundAmount(0);
            console.log("트랜잭션 전송(Refund)", tx.hash);
            const result = await tx.wait();

            if(result.status === 1) {
                console.log("트랜잭션 성공!:", result);
                console.log("블록 번호:", result.blockNumber);
            } else {
                console.error("트랜잭션 실패", result);
            }
        } catch(error) {
            console.log("Refund 실패:", error);
        }
    }, [streamWriteContract, userAddress, refundAmount, fetchUserInfo]);

    const [hour, setHour] = useState<number>(0);
    const [dollar, setDollar] = useState<number>(0);

    const loadSetSecondFee = useCallback(async() => {
        if(!streamWriteContract || !hour || !dollar) return;

        try {
            const tx = await streamWriteContract.setSecondFee(
                hour,
                dollar
            )

            setHour(0);
            setDollar(0);
            console.log("트랜잭션 전송(setSecondFee)", tx.hash);
            const result = await tx.wait();

            if(result.status === 1) {
                console.log("트랜잭션 성공!:", result);
                console.log("블록 번호:", result.blockNumber);
            } else {
                console.error("트랜잭션 실패", result);
            }
        } catch(error) {
            console.log("setSecondFee 실패:", error);
        }
    }, [streamWriteContract, hour, dollar]);

    const loadSetOwner = useCallback(async() => {
        if(!streamWriteContract || !newOwner) return;

        try {
            const tx = await streamWriteContract.setOwner(
                newOwner
            )

            setNewOwner('');
            console.log("트랜잭션 전송(setSecondFee)", tx.hash);
            const resultOwner = await streamWriteContract.owner();
            console.log("새로운 owner", resultOwner);

            await tx.wait();
        } catch(error) {
            console.log("setOwner 실패:", error);
        }
    }, [streamWriteContract, newOwner]);

    const loadWithdrawOwner = useCallback(async() => {
        if(!streamWriteContract || !sendTo || !sendAmount) return;

        try {
            const tx = await streamWriteContract.withdrawOwner(
                sendTo,
                sendAmount
            )

            setSendTo('');
            setSendAmount(0);
            console.log("트랜잭션 전송(setSecondFee)", tx.hash);
            await tx.wait();
        } catch(error) {
            console.log("WithdrawOwner 실패:", error);
        }
    }, [streamWriteContract, sendTo, sendAmount]);

    const loadRescueLockMoney = useCallback(async() => {
        if(!streamWriteContract || !sendTo || !sendAmount) return;

        try {
            const tx = await streamWriteContract.rescueLockMoney(
                sendTo,
                sendAmount
            )

            setSendTo('');
            setSendAmount(0);
            console.log("트랜잭션 전송(setSecondFee)", tx.hash);
            await tx.wait();
        } catch(error) {
            console.log("WithdrawOwner 실패:", error);
        }
    }, [streamWriteContract, sendTo, sendAmount]);


    // viewRemainStreamTime(address user) public view
    const loadViewReaminStreamtime = useCallback(async() => {
        if(!streamReadContract || !userAddress) return;

        try {
            const second = await streamReadContract.viewRemainStreamTime(
                userAddress
            );
            setRemainTime(Number(second));
            console.log(`${userAddress}의 남은 시간 ${second}분 입니다`);
            setUserAddress('');
            
        } catch(error) {
            console.log("남은 시간 조회 실패:", error);
        }
    }, [streamReadContract, userAddress]);

    useEffect(() => {
        const setupFactoryApp = async () => {
            try {
                const ethProvider = await initProvider();
                if (!ethProvider) return;

                setProvider(ethProvider);
                const accounts = await ethProvider.send("eth_requestAccounts", []);
                if (accounts.length === 0) throw new Error("No accounts");

                const signer = await ethProvider.getSigner(accounts[0]);
                const readContract = new Contract(STREAM_ADDRESS, STREAM_ABI, ethProvider);
                const writeContract = new Contract(STREAM_ADDRESS, STREAM_ABI, signer);
                const owner = await readContract.owner();

                setAccount(accounts[0]);
                setOwnerAddress(owner);
                setStreamReadContract(readContract);
                setStreamWriteContract(writeContract);
            } catch (err) {
                console.error("초기화 에러:", err);
                setAccount(null);
            }
        };

        setupFactoryApp();
    
        const handleAccountsChanged = (accs: string[]) => {
            if (accs.length > 0) {
                setAccount(accs[0]);
            } else {
                setAccount(null);
                setError("지갑 연결 해제됨");
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);
    
    return (
        <div>
            <h1>User Payment</h1>
            <p>Owner: {ownerAddress}</p>
            <p>연결된 계정: {account}</p>
            <p>현재 컨트랙트 주소: {STREAM_ADDRESS}</p>
            <div className="container">
                <div>
                    <h4>Start stream</h4>
                    <div>
                        <input
                            type="string"
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                            placeholder="Enter User Address"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={timeOutMin}
                            onChange={(e) => setTimeOutMin(Number(e.target.value))}
                            placeholder="Enter Timeout(min)"
                        />
                    </div>
                    <div>
                        <button onClick={loadStartStream}>Start stream</button>
                    </div>
                </div>

                <div>
                    <h4>End stream</h4>
                    <div>
                        <input
                            type="string"
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                            placeholder="Enter User Address"
                        />
                    </div>
                    <div>
                        <button onClick={loadEndStream}>End stream</button>
                    </div>
                </div>

                <div>
                    <h4>Deposit</h4>
                    <div>
                        <input
                            type="string"
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                            placeholder="Enter User Address"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(Number(e.target.value))}
                            placeholder="Please check approve"
                        />
                    </div>
                    <div>
                        <button onClick={loadDeposit}>Deposit</button>
                    </div>
                </div>

                <div>
                    <h4>Refund</h4>
                    <div>
                        <input
                            type="string"
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                            placeholder="Enter User Address"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(Number(e.target.value))}
                            placeholder="Enter Refund Amount"
                        />
                    </div>
                    <div>
                        <button onClick={loadRefund}>Refund</button>
                    </div>
                </div>
                <div>
                <h4>View Remain Time</h4>
                <div>
                    <input
                        type="string"
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                        placeholder="Enter User Address"
                    />
                </div>
                <div>
                    <button onClick={loadViewReaminStreamtime}>Remain Time</button>
                </div>
                <div>
                    <p>남은시간: {remainTime}</p>
                </div>
            </div>
            </div>
            <div className="onlyOwner">
                <h2>Callable only Owner</h2>
                <div>
                    <h4>Set Fee by Owner</h4>
                    <div>
                        <input
                            type="number"
                            value={hour}
                            onChange={(e) => setHour(Number(e.target.value))}
                            placeholder="Enter hour"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={dollar}
                            onChange={(e) => setDollar(Number(e.target.value))}
                            placeholder="Enter dollar(minimum 1,000,000 - 1dollar)"
                        />
                    </div>
                    <div>
                        <button onClick={loadSetSecondFee}>Set Fee</button>
                    </div>
                </div>
                <div>
                    <h4>Set New Owner by Owner</h4>
                    <div>
                        <input
                            type="string"
                            value={newOwner}
                            onChange={(e) => setNewOwner(e.target.value)}
                            placeholder="Enter New Owner Address"
                        />
                    </div>
                    <div>
                        <button onClick={loadSetOwner}>Set Owner</button>
                    </div>
                </div>
                <div>
                    <h4>Withdraw profit by Owner</h4>
                    <div>
                        <input
                            type="string"
                            value={sendTo}
                            onChange={(e) => setSendTo(e.target.value)}
                            placeholder="Enter received Address"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(Number(e.target.value))}
                            placeholder="Enter amount"
                        />
                    </div>
                    <div>
                        <button onClick={loadWithdrawOwner}>Withdraw Profit</button>
                    </div>
                </div>
                <div>
                    <h4>Rescue Lock Money by Owner</h4>
                    <div>
                        <input
                            type="string"
                            value={sendTo}
                            onChange={(e) => setSendTo(e.target.value)}
                            placeholder="Enter received Address"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(Number(e.target.value))}
                            placeholder="Enter amount"
                        />
                    </div>
                    <div>
                        <button onClick={loadRescueLockMoney}>Rescue Lock Money</button>
                    </div>
                
                </div>
            </div>
            <div className="container">
                <h4>User Info</h4>
                <input
                    type="text"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    placeholder="Enter User Address"
                />
                <button onClick={fetchUserInfo}>View User Info</button>
                <div>
                    <p>User: {userInfo.user}</p>
                    <p>charge: {userInfo.charge}</p>
                    <p>lastStart: {userInfo.time.lastStart}</p>
                    <p>lastEnd: {userInfo.time.lastEnd}</p>
                </div>
            </div>
        </div>
    )
}

export default StreamingApp;