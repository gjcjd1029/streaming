import { ethers, BrowserProvider, Contract} from 'ethers';
import { useEffect, useState, useCallback } from 'react';
import UserPaymentJson from "../public/userPayment.json";
import './index.css';

const STREAM_ABI = UserPaymentJson.abi;
const STREAM_ADDRESS = "0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968";

async function initProvider(): Promise<BrowserProvider | null> {
    if(window.ethereum) {
        console.log("메타마스크 연결 시도...");
        return new BrowserProvider(window.ethereum);
    } else {
        console.log("메타마스크 연결 실패: window.ethereum 객체를 찾을 수 없습니다.");
        return null;
    }
}

interface USERdetail {
    user: string;
    charge: bigint;
    time: {
        lastStart: bigint;
        lastEnd: bigint;
    }
}

function StreamingApp() {
    // 상태 변수
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

    const [startStreamUserAddress, setStartStreamUserAddress] = useState<string>('');
    const [timeOutMin, setTimeOutMin] = useState<number>(0);

    const [endStreamUserAddress, setEndStreamUserAddress] = useState<string>('');

    const [depositUserAddress, setDepositUserAddress] = useState<string>('');
    const [sendAmount, setSendAmount] = useState<number>(0);

    const [refundUserAddress, setRefundUserAddress] = useState<string>('');
    const [refundAmount, setRefundAmount] = useState<number>(0);

    const [viewRemainTimeUserAddress, setViewRemainTimeUserAddress] = useState<string>('');
    const [remainTime, setRemainTime] = useState<number>(0);

    const [hour, setHour] = useState<number>(0);
    const [dollar, setDollar] = useState<number>(0);

    const [newOwner, setNewOwner] = useState<string>('');
    const [withdrawSendTo, setWithdrawSendTo] = useState<string>('');
    const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

    const [rescueSendTo, setRescueSendTo] = useState<string>('');
    const [rescueAmount, setRescueAmount] = useState<number>(0);


    // 함수 정의
    const fetchUserInfo = useCallback(async() => {
        if (!streamReadContract) {
            console.error("fetchUserInfo 에러: streamReadContract가 초기화되지 않았습니다.");
            setError("컨트랙트가 로드되지 않았습니다. 메타마스크 연결을 확인해주세요.");
            return;
        }

        if (!userAddress || !ethers.isAddress(userAddress)) {
            console.warn("fetchUserInfo 경고: 유효한 사용자 주소가 아닙니다. (값:", userAddress, ")");
            setError("사용자 정보를 조회하려면 유효한 이더리움 주소를 입력해주세요.");
            setUserInfo({ user: '', charge: 0n, time: {lastStart: 0n, lastEnd: 0n} });
            return;
        }

        try {
            const streamData = await streamReadContract.users(userAddress);
            console.log("컨트랙트에서 받은 Raw streamData:", streamData);

            setUserInfo({
                user: streamData.user || '',
                charge: BigInt((streamData.charge ?? 0n).toString()),
                time: {
                    lastStart: BigInt((streamData.time?.lastStart ?? 0n).toString()),
                    lastEnd: BigInt((streamData.time?.lastEnd ?? 0n).toString())
                }
            });
            setError('');
        } catch(err: any) {
            console.error("fetchUserInfo 에러 발생:", err);
            setError(`사용자 정보를 가져오는데 실패했습니다: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
            setUserInfo({ user: '', charge: 0n, time: {lastStart: 0n, lastEnd: 0n} });
        }
    }, [streamReadContract, userAddress]);

    const loadStartStream = useCallback(async() => {
        if(!streamWriteContract) {
            setError("컨트랙트가 로드되지 않았습니다."); return;
        }
        if(!startStreamUserAddress || !ethers.isAddress(startStreamUserAddress)) {
            setError("시작할 사용자 주소를 올바르게 입력해주세요."); return;
        }

        try {
            setError('');
            const tx = await streamWriteContract.startStream(
                startStreamUserAddress,
                timeOutMin
            );
            console.log("Start stream 트랜잭션 전송:", tx.hash);
            await tx.wait();
            console.log("Start stream 성공!");
            fetchUserInfo();
            setStartStreamUserAddress('');
            setTimeOutMin(0);
        } catch(err: any) {
            console.error("Start stream 실패:", err);
            setError(`스트림 시작 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
        }
    }, [streamWriteContract, startStreamUserAddress, timeOutMin, fetchUserInfo]);

    const loadEndStream = useCallback(async() => {
        if(!streamWriteContract) {
            setError("컨트랙트가 로드되지 않았습니다."); return;
        }
        if(!endStreamUserAddress || !ethers.isAddress(endStreamUserAddress)) {
            setError("종료할 사용자 주소를 올바르게 입력해주세요."); return;
        }

        try {
            setError('');
            const tx = await streamWriteContract.endStream(endStreamUserAddress);
            console.log("End stream 트랜잭션 전송:", tx.hash);
            await tx.wait();
            console.log("End stream 성공!");
            fetchUserInfo();
            setEndStreamUserAddress('');
        } catch(err: any) {
            console.error("End stream 실패:", err);
            setError(`스트림 종료 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
        }
    }, [streamWriteContract, endStreamUserAddress, fetchUserInfo]);


    const loadDeposit = useCallback(async() => {
        if(!streamWriteContract) {
            setError("컨트랙트가 로드되지 않았습니다."); return;
        }
        if(!depositUserAddress || !ethers.isAddress(depositUserAddress)) {
            setError("입금할 사용자 주소를 올바르게 입력해주세요."); return;
        }
        if(sendAmount <= 0) {
            setError("유효한 입금액을 입력해주세요."); return;
        }

        try {
            setError('');
            const tx = await streamWriteContract.deposit(
                depositUserAddress,
                sendAmount
            );
            console.log("Deposit 트랜잭션 전송:", tx.hash);
            await tx.wait();
            console.log("Deposit 성공!");
            fetchUserInfo();
            setDepositUserAddress('');
            setSendAmount(0);
        } catch(err: any) {
            console.error("Deposit 실패:", err);
            setError(`입금 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
        }
    }, [streamWriteContract, depositUserAddress, sendAmount, fetchUserInfo]);


    const loadRefund = useCallback(async() => {
        if(!streamWriteContract) {
            setError("컨트랙트가 로드되지 않았습니다."); return;
        }
        if(!refundUserAddress || !ethers.isAddress(refundUserAddress)) {
            setError("환불할 사용자 주소를 올바르게 입력해주세요."); return;
        }
        if(refundAmount <= 0) {
            setError("유효한 환불액을 입력해주세요."); return;
        }

        try {
            setError('');
            const tx = await streamWriteContract.refund(
                refundUserAddress,
                refundAmount
            );
            console.log("Refund 트랜잭션 전송:", tx.hash);
            const result = await tx.wait();

            if(result?.status === 1) {
                console.log("Refund 성공!:", result);
                console.log("블록 번호:", result.blockNumber);
            } else {
                console.error("Refund 트랜잭션 실패 (status 0):", result);
                setError("환불 트랜잭션 실패.");
            }
            fetchUserInfo();
            setRefundUserAddress('');
            setRefundAmount(0);
        } catch(err: any) {
            console.error("Refund 실패:", err);
            setError(`환불 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
        }
    }, [streamWriteContract, refundUserAddress, refundAmount, fetchUserInfo]);

    const loadSetSecondFee = useCallback(async() => {
        if(!streamWriteContract) {
            setError("컨트랙트가 로드되지 않았습니다."); return;
        }
        if(hour <= 0 || dollar <= 0) {
            setError("유효한 시간(hour)과 금액(dollar)을 입력해주세요."); return;
        }

        try {
            setError('');
            const tx = await streamWriteContract.setSecondFee(
                hour,
                dollar
            );
            console.log("SetSecondFee 트랜잭션 전송:", tx.hash);
            const result = await tx.wait();

            if(result?.status === 1) {
                console.log("SetSecondFee 성공!:", result);
                console.log("블록 번호:", result.blockNumber);
            } else {
                console.error("SetSecondFee 트랜잭션 실패 (status 0):", result);
                setError("요금 설정 트랜잭션 실패.");
            }
            setHour(0);
            setDollar(0);
        } catch(err: any) {
            console.error("SetSecondFee 실패:", err);
            setError(`요금 설정 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
        }
    }, [streamWriteContract, hour, dollar]);

    const loadSetOwner = useCallback(async() => {
        if(!streamWriteContract) {
            setError("컨트랙트가 로드되지 않았습니다."); return;
        }
        if(!newOwner || !ethers.isAddress(newOwner)) {
            setError("새로운 소유자 주소를 올바르게 입력해주세요."); return;
        }

        try {
            setError('');
            const tx = await streamWriteContract.setOwner(newOwner);
            console.log("SetOwner 트랜잭션 전송:", tx.hash);
            await tx.wait();
            console.log("SetOwner 성공!");
            const updatedOwner = await streamReadContract?.owner();
            if (updatedOwner) setOwnerAddress(updatedOwner);
            setNewOwner('');
        } catch(err: any) {
            console.error("SetOwner 실패:", err);
            setError(`소유자 변경 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
        }
    }, [streamWriteContract, newOwner, streamReadContract]);

    const loadWithdrawOwner = useCallback(async() => {
        if(!streamWriteContract) {
            setError("컨트랙트가 로드되지 않았습니다."); return;
        }
        if(!withdrawSendTo || !ethers.isAddress(withdrawSendTo)) {
            setError("이득을 보낼 주소를 올바르게 입력해주세요."); return;
        }
        if(withdrawAmount <= 0) {
            setError("유효한 금액을 입력해주세요."); return;
        }

        try {
            setError('');
            const tx = await streamWriteContract.withdrawOwner(
                withdrawSendTo,
                withdrawAmount
            );
            console.log("WithdrawOwner 트랜잭션 전송:", tx.hash);
            await tx.wait();
            console.log("WithdrawOwner 성공!");
            setWithdrawSendTo('');
            setWithdrawAmount(0);
        } catch(err: any) {
            console.error("WithdrawOwner 실패:", err);
            setError(`이득 출금 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
        }
    }, [streamWriteContract, withdrawSendTo, withdrawAmount]);

    const loadRescueLockMoney = useCallback(async() => {
        if(!streamWriteContract) {
            setError("컨트랙트가 로드되지 않았습니다."); return;
        }
        if(!rescueSendTo || !ethers.isAddress(rescueSendTo)) {
            setError("구조된 돈을 보낼 주소를 올바르게 입력해주세요."); return;
        }
        if(rescueAmount <= 0) {
            setError("유효한 금액을 입력해주세요."); return;
        }

        try {
            setError('');
            const tx = await streamWriteContract.rescueLockMoney(
                rescueSendTo,
                rescueAmount
            );
            console.log("RescueLockMoney 트랜잭션 전송:", tx.hash);
            await tx.wait();
            console.log("RescueLockMoney 성공!");
            setRescueSendTo('');
            setRescueAmount(0);
        } catch(err: any) {
            console.error("RescueLockMoney 실패:", err);
            setError(`갇힌 돈 구조 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
        }
    }, [streamWriteContract, rescueSendTo, rescueAmount]);

    const loadViewReaminStreamtime = useCallback(async() => {
        if(!streamReadContract) {
            setError("컨트랙트가 로드되지 않았습니다."); return;
        }
        if(!viewRemainTimeUserAddress || !ethers.isAddress(viewRemainTimeUserAddress)) {
            setError("남은 시간을 조회할 사용자 주소를 올바르게 입력해주세요."); return;
        }

        try {
            setError('');
            const second = await streamReadContract.viewRemainStreamTime(
                viewRemainTimeUserAddress
            );
            setRemainTime(Number(second));
            console.log(`${viewRemainTimeUserAddress}의 남은 시간 ${second}분 입니다`);
            setViewRemainTimeUserAddress('');
        } catch(err: any) {
            console.error("남은 시간 조회 실패:", err);
            setError(`남은 시간 조회 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
        }
    }, [streamReadContract, viewRemainTimeUserAddress]);


    useEffect(() => {
        const setupFactoryApp = async () => {
            try {
                const ethProvider = await initProvider();
                if (!ethProvider) {
                    setError("메타마스크 연결이 필요합니다.");
                    return;
                }

                setProvider(ethProvider);
                const accounts = await ethProvider.send("eth_requestAccounts", []);
                if (accounts.length === 0) {
                    throw new Error("연결된 계정이 없습니다.");
                }

                const signer = await ethProvider.getSigner(accounts[0]);
                const readContract = new Contract(STREAM_ADDRESS, STREAM_ABI, ethProvider);
                const writeContract = new Contract(STREAM_ADDRESS, STREAM_ABI, signer);
                const owner = await readContract.owner();

                setAccount(accounts[0]);
                setOwnerAddress(owner);
                setStreamReadContract(readContract);
                setStreamWriteContract(writeContract);
                setError('');
            } catch (err: any) {
                console.error("초기화 에러 발생:", err);
                setAccount(null);
                setError(`앱 초기화 실패: ${err.shortMessage || err.message || "알 수 없는 오류"}`);
            }
        };

        setupFactoryApp();

        const handleAccountsChanged = (accs: string[]) => {
            if (accs.length > 0) {
                setAccount(accs[0]);
                setError('');
            } else {
                setAccount(null);
                setError("지갑 연결 해제됨. 다시 연결해주세요.");
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
            <h1>User Payment 스트리밍 앱</h1>
            <p>컨트랙트 소유자: {ownerAddress}</p>
            <p>현재 연결된 계정: {account || '연결 안 됨'}</p>
            <p>배포된 컨트랙트 주소: {STREAM_ADDRESS}</p>

            {error && <div style={{ color: 'red', border: '1px solid red', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
                <p>오류 발생: {error}</p>
            </div>}

            <div className="container">
                <h4>사용자 정보 조회</h4>
                <div>
                    <input
                        type="text"
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                        placeholder="조회할 사용자 주소 (0x...)"
                    />
                    <button onClick={fetchUserInfo}>정보 조회</button>
                </div>
                <div>
                    <p>사용자 주소: {userInfo.user || '없음'}</p>
                    <p>누적 요금: {userInfo.charge !== 0n ? userInfo.charge.toString() : '0'} (단위: wei)</p>
                    <p>마지막 시작 시간: {userInfo.time.lastStart !== 0n ? new Date(Number(userInfo.time.lastStart) * 1000).toLocaleString() : '없음'}</p>
                    <p>마지막 종료 시간: {userInfo.time.lastEnd !== 0n ? new Date(Number(userInfo.time.lastEnd) * 1000).toLocaleString() : '없음'}</p>
                </div>
            </div>

            <div className="container">
                <div>
                    <h4>스트림 시작</h4>
                    <div>
                        <input
                            type="text"
                            value={startStreamUserAddress}
                            onChange={(e) => setStartStreamUserAddress(e.target.value)}
                            placeholder="스트림 시작할 사용자 주소"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={timeOutMin}
                            onChange={(e) => setTimeOutMin(Number(e.target.value))}
                            placeholder="타임아웃 (분)"
                        />
                    </div>
                    <div>
                        <button onClick={loadStartStream}>스트림 시작</button>
                    </div>
                </div>

                <div>
                    <h4>스트림 종료</h4>
                    <div>
                        <input
                            type="text"
                            value={endStreamUserAddress}
                            onChange={(e) => setEndStreamUserAddress(e.target.value)}
                            placeholder="스트림 종료할 사용자 주소"
                        />
                    </div>
                    <div>
                        <button onClick={loadEndStream}>스트림 종료</button>
                    </div>
                </div>

                <div>
                    <h4>입금 (Deposit)</h4>
                    <div>
                        <input
                            type="text"
                            value={depositUserAddress}
                            onChange={(e) => setDepositUserAddress(e.target.value)}
                            placeholder="입금할 사용자 주소"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(Number(e.target.value))}
                            placeholder="입금할 금액 (단위: wei)"
                        />
                    </div>
                    <div>
                        <button onClick={loadDeposit}>입금하기</button>
                    </div>
                </div>

                <div>
                    <h4>환불 (Refund)</h4>
                    <div>
                        <input
                            type="text"
                            value={refundUserAddress}
                            onChange={(e) => setRefundUserAddress(e.target.value)}
                            placeholder="환불받을 사용자 주소"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(Number(e.target.value))}
                            placeholder="환불할 금액 (단위: wei)"
                        />
                    </div>
                    <div>
                        <button onClick={loadRefund}>환불하기</button>
                    </div>
                </div>

                <div>
                    <h4>남은 시간 조회</h4>
                    <div>
                        <input
                            type="text"
                            value={viewRemainTimeUserAddress}
                            onChange={(e) => setViewRemainTimeUserAddress(e.target.value)}
                            placeholder="남은 시간 조회할 사용자 주소"
                        />
                    </div>
                    <div>
                        <button onClick={loadViewReaminStreamtime}>남은 시간 보기</button>
                    </div>
                    <div>
                        <p>남은 시간: {remainTime} 분</p>
                    </div>
                </div>
            </div>
        
            <div className="onlyOwner">
                <h2>소유자만 호출 가능</h2>
                <div>
                    <h4>요금 설정</h4>
                    <div>
                        <input
                            type="number"
                            value={hour}
                            onChange={(e) => setHour(Number(e.target.value))}
                            placeholder="시간 (hour)"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={dollar}
                            onChange={(e) => setDollar(Number(e.target.value))}
                            placeholder="달러당 wei (예: 1,000,000 wei = 1달러)"
                        />
                    </div>
                    <div>
                        <button onClick={loadSetSecondFee}>요금 설정</button>
                    </div>
                </div>

                <div>
                    <h4>새로운 소유자 설정</h4>
                    <div>
                        <input
                            type="text"
                            value={newOwner}
                            onChange={(e) => setNewOwner(e.target.value)}
                            placeholder="새로운 소유자 주소"
                        />
                    </div>
                    <div>
                        <button onClick={loadSetOwner}>소유자 변경</button>
                    </div>
                </div>

                <div>
                    <h4>이득 인출</h4>
                    <div>
                        <input
                            type="text"
                            value={withdrawSendTo}
                            onChange={(e) => setWithdrawSendTo(e.target.value)}
                            placeholder="인출받을 주소"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                            placeholder="인출할 금액 (단위: wei)"
                        />
                    </div>
                    <div>
                        <button onClick={loadWithdrawOwner}>이득 인출</button>
                    </div>
                </div>

                <div>
                    <h4>갇힌 돈 구조</h4>
                    <div>
                        <input
                            type="text"
                            value={rescueSendTo}
                            onChange={(e) => setRescueSendTo(e.target.value)}
                            placeholder="구조된 돈을 받을 주소"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={rescueAmount}
                            onChange={(e) => setRescueAmount(Number(e.target.value))}
                            placeholder="구조할 금액 (단위: wei)"
                        />
                    </div>
                    <div>
                        <button onClick={loadRescueLockMoney}>갇힌 돈 구조</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StreamingApp;