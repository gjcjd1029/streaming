import { ethers, BrowserProvider, type Signer, Contract } from 'ethers';
import { useEffect, useState, useCallback } from 'react';
import USDCJson from "../public/USDC.json"; // 이 경로가 여러분의 USDC(스트리밍 재화) ABI 파일 경로와 일치하는지 확인하세요!
import './index.css';

const USDC_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const USDC_ABI = USDCJson.abi;
// -----------------------------------------------------

// initProvider 함수는 동일하게 유지
async function initProvider(): Promise<BrowserProvider | null> {
    if(window.ethereum) {
        console.log("메타마스크 연결 완료");
        return new BrowserProvider(window.ethereum);
    } else {
        console.log("메타마스크 설치 또는 웹3지갑이 활성화된 브라우저를 사용해주세요.");
        return null;
    }
}

function MyDapp() {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const [tokenReadContract, setTokenReadContract] = useState<Contract | null>(null);
    const [tokenWriteContract, setTokenWriteContract] = useState<Contract | any>(null);

    const [tokenBalance, setTokenBalance] = useState<string | null>(null);
    const [balanceLoading, setBalanceLoading] = useState<boolean>(false);

    const [approveAddress, setApproveAddress] = useState(''); // approve할 주소를 사용자로부터 입력받을 상태
    const [approveAmount, setApproveAmount] = useState('10');
    const [allowance, setAllowance] = useState<string | null>(null);
    const [approveLoading, setApproveLoading] = useState<boolean>(false);

    const [acquireRecipient, setAcquireRecipient] = useState('');
    const [acquireLoading, setAcquireLoading] = useState<boolean>(false);

    const [tokenName, setTokenName] = useState<string | null>(null);
    const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
    const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);

    const fetchTokenInfo = useCallback(async () => {
        if (!tokenReadContract) return;
        try {
            const name = await tokenReadContract.name();
            const symbol = await tokenReadContract.symbol();
            const decimals = await tokenReadContract.decimals();
            setTokenName(name);
            setTokenSymbol(symbol);
            setTokenDecimals(decimals);
            console.log(`연결된 토큰: ${name} (${symbol}, Decimals: ${decimals})`);
        } catch (e: unknown) {
            console.error("토큰 정보 조회 실패:", e);
            if (e instanceof Error) {
                setError(`토큰 정보 조회에 실패했습니다: ${e.message}`);
            } else {
                setError(`토큰 정보 조회에 실패했습니다: ${String(e)}`);
            }
        }
    }, [tokenReadContract]);

    const fetchTokenBalance = useCallback(async () => {
        if (!tokenReadContract || !account || tokenDecimals === null) {
            setTokenBalance(null);
            return;
        }
        setBalanceLoading(true);
        setError('');
        try {
            const rawBalance = await tokenReadContract.balanceOf(account);
            const formattedBalance = ethers.formatUnits(rawBalance, tokenDecimals);
            setTokenBalance(formattedBalance);
            console.log(`내 토큰 잔액: ${formattedBalance}`);
        } catch (e: unknown) {
            console.error("잔액 조회 실패:", e);
            if (e instanceof Error) {
                setError(`잔액 조회에 실패했습니다: ${e.message}`);
            } else {
                setError(`잔액 조회에 실패했습니다: ${String(e)}`);
            }
            setTokenBalance(null);
        } finally {
            setBalanceLoading(false);
        }
    }, [tokenReadContract, account, tokenDecimals]);

    const fetchAllowance = useCallback(async () => {
        if (!tokenReadContract || !account || tokenDecimals === null) {
            setAllowance(null);
            return;
        }
        // 💡 중요: 사용자가 입력한 approveAddress에 대한 allowance를 조회하도록 수정
        // 만약 approveAddress가 비어있다면, USDC_ADDRESS에 대한 allowance를 조회하는 등 폴백 로직을 추가할 수 있습니다.
        const spenderAddress = approveAddress && ethers.isAddress(approveAddress) ? approveAddress : USDC_ADDRESS; // 입력값 유효하면 사용, 아니면 기본 USDC_ADDRESS
        
        try {
            const rawAllowance = await tokenReadContract.allowance(account, spenderAddress); // 💡 spenderAddress 사용
            const formattedAllowance = ethers.formatUnits(rawAllowance, tokenDecimals);
            setAllowance(formattedAllowance);
            console.log(`${spenderAddress}에 승인된 토큰 금액: ${formattedAllowance}`);
        } catch (e: unknown) {
            console.error("Allowance 조회 실패:", e);
            if (e instanceof Error) {
                setError(`승인 금액 조회에 실패했습니다: ${e.message}`);
            } else {
                setError(`승인 금액 조회에 실패했습니다: ${String(e)}`);
            }
            setAllowance(null);
        }
    }, [tokenReadContract, account, tokenDecimals, approveAddress]); // 💡 approveAddress를 의존성 배열에 추가

    const handleApprove = useCallback(async () => {
        if (!tokenWriteContract || !account || !approveAmount || tokenDecimals === null) {
            alert("지갑이 연결되지 않았거나 승인 금액이 유효하지 않습니다.");
            return;
        }
        // 💡 사용자 입력 approveAddress 유효성 검사 추가
        if (!ethers.isAddress(approveAddress)) {
            alert("승인할 유효한 이더리움 주소를 입력해주세요.");
            return;
        }

        setApproveLoading(true);
        setError('');

        try {
            const amountToApprove = ethers.parseUnits(approveAmount, tokenDecimals);
            // 💡 USDC_ADDRESS 대신 approveAddress 사용
            console.log(`Approving ${approveAmount} ${tokenSymbol} (${amountToApprove.toString()} raw) for ${approveAddress}`);

            const tx = await tokenWriteContract.approve(approveAddress, amountToApprove); // 💡 tokenWriteContract 사용, approveAddress로 변경
            console.log("Approve 트랜잭션 전송됨:", tx.hash);

            const receipt = await tx.wait();
            if (receipt.status === 1) {
                alert("Approve 트랜잭션 성공!");
                const amount = await tokenWriteContract.allowance(account, approveAddress);
                console.log("Approve 양:", amount);
                await fetchAllowance(); // 승인 후 allowance 다시 조회
            } else {
                setError("Approve 트랜잭션 실패!");
                console.error("Approve 실패 영수증:", receipt);
            }
        } catch (e: unknown) {
            console.error("Approve 에러:", e);
            if (e instanceof Error) {
                setError(`Approve 중 오류 발생: ${e.message}`);
            } else {
                setError(`Approve 중 오류 발생: ${String(e)}`);
            }
        } finally {
            setApproveLoading(false);
        }
    }, [tokenWriteContract, account, approveAddress, approveAmount, tokenDecimals, tokenSymbol, fetchAllowance]); // 💡 approveAddress 의존성 추가

    const handleAcquire = useCallback(async () => {
        if (!tokenWriteContract || !account || !acquireRecipient) {
            alert("지갑이 연결되지 않았거나, 받을 주소가 유효하지 않습니다.");
            return;
        }
        if (!ethers.isAddress(acquireRecipient)) {
            alert("유효한 이더리움 주소를 입력해주세요.");
            return;
        }

        setAcquireLoading(true);
        setError('');

        try {
            console.log(`Acquiring for ${acquireRecipient} via ${USDC_ADDRESS}`);

            // 💡 tokenWriteContract 사용
            const tx = await tokenWriteContract.acquire(acquireRecipient); 
            console.log("Acquire 트랜잭션 전송됨:", tx.hash);

            const receipt = await tx.wait();
            if (receipt.status === 1) {
                alert("Acquire 트랜잭션 성공!");
                console.log("Acquire 영수증:", receipt);
                await fetchTokenBalance();
                await fetchAllowance();
            } else {
                setError("Acquire 트랜잭션 실패!");
                console.error("Acquire 실패 영수증:", receipt);
            }
        } catch (e: unknown) {
            console.error("Acquire 에러:", e);
            if (e instanceof Error) {
                setError(`Acquire 중 오류 발생: ${e.message}`);
            } else {
                setError(`Acquire 중 오류 발생: ${String(e)}`);
            }
        } finally {
            setAcquireLoading(false);
        }
    }, [tokenWriteContract, account, acquireRecipient, fetchTokenBalance, fetchAllowance]);

    // DApp 초기화 및 이벤트 리스너 설정 (Provider 및 Contract 인스턴스 생성)
    useEffect(() => {
        const setupDapp = async () => {
            setLoading(true);
            setError('');

            try {
                const ethProvider = await initProvider();
                if (ethProvider) {
                    setProvider(ethProvider);

                    const accounts = await ethProvider.send("eth_requestAccounts", []);
                    if (accounts.length > 0) {
                        const connectedAccount = accounts[0];
                        setAccount(connectedAccount);
                        console.log("계정 연결 성공", connectedAccount);

                        const signer = await ethProvider.getSigner(connectedAccount);
                        const readContract = new Contract(USDC_ADDRESS, USDC_ABI, ethProvider);
                        const writeContract = readContract.connect(signer);
                        
                        setTokenReadContract(readContract);
                        setTokenWriteContract(writeContract);
                        console.log("게임 토큰 컨트랙트 (읽기/쓰기) 인스턴스 준비 완료.");

                    } else {
                        setError("MetaMask 계정 연결이 필요합니다.");
                        setAccount(null);
                    }
                } else {
                    setError("Provider 초기화 실패. MetaMask를 확인해주세요.");
                }
            } catch (err: unknown) {
                console.error("DApp 초기화 또는 계정 연결 에러:", err);
                if (err instanceof Error) {
                    setError(`DApp 초기화 중 오류 발생: ${err.message}`);
                } else {
                    setError(`DApp 초기화 중 오류 발생: ${String(err)}`);
                }
                setAccount(null);
            } finally {
                setLoading(false);
            }
        };

        setupDapp();

        if (window.ethereum) {
            const handleAccountsChanged = (accs: string[]) => {
                if (accs.length > 0) {
                    setAccount(accs[0]);
                    console.log("계정 변경됨:", accs[0]);
                } else {
                    setAccount(null);
                    setError("지갑 연결이 해제되었습니다. 다시 연결해주세요.");
                    console.log("지갑 연결 해제됨.");
                }
            };

            const handleChainChanged = (chainId: string) => {
                console.log("네트워크 변경 감지됨. 새로운 체인 ID:", parseInt(chainId, 16));
                setError(`네트워크가 변경되었습니다. (Chain ID: ${parseInt(chainId, 16)}). DApp을 새로고침해주세요.`);
                setProvider(null);
                setAccount(null);
                setTokenReadContract(null);
                setTokenWriteContract(null);
                setTokenBalance(null);
                setAllowance(null);
                setTokenName(null);
                setTokenSymbol(null);
                setTokenDecimals(null);
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                if (window.ethereum) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                    console.log("MetaMask 이벤트 리스너 제거됨.");
                }
            };
        }
    }, []);

    useEffect(() => {
        if (tokenReadContract) {
            fetchTokenInfo();
        }
    }, [tokenReadContract, fetchTokenInfo]);

    useEffect(() => {
        if (provider && account && tokenReadContract && tokenDecimals !== null) {
            fetchTokenBalance();
            fetchAllowance(); // 💡 approveAddress 변경될 때 allowance도 다시 가져오도록 연결
        } else {
            setTokenBalance(null);
            setAllowance(null);
        }
    }, [provider, account, tokenReadContract, tokenDecimals, approveAddress, fetchTokenBalance, fetchAllowance]); // 💡 approveAddress 의존성 추가

    if (loading) {
        return <p>지갑 연결 및 초기화 중...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>에러: {error}</p>;
    }

    return (
        <div className="dapp-container">
            <h1>mocUSDC DApp</h1>
            <p>연결된 계정: {account || '지갑이 연결되지 않았습니다.'}</p>

            {account && provider && tokenReadContract && tokenWriteContract && (
                <div>
                    <h2>스트리밍 재화 ({tokenSymbol || '토큰'})</h2>
                    <p>컨트랙트 주소: {USDC_ADDRESS}</p>
                    <p>토큰 이름: {tokenName || '로딩 중...'}</p>
                    <p>토큰 심볼: {tokenSymbol || '로딩 중...'}</p>
                    <p>소수점 자릿수: {tokenDecimals !== null ? tokenDecimals : '로딩 중...'}</p>

                    {balanceLoading ? (
                        <p>잔액 조회 중...</p>
                    ) : (
                        <p>내 {tokenSymbol || '토큰'} 잔액: {tokenBalance !== null ? tokenBalance : '조회 실패 또는 없음'}</p>
                    )}
                    <button onClick={fetchTokenBalance} disabled={balanceLoading}>
                        {balanceLoading ? '잔액 조회 중...' : `내 ${tokenSymbol || '토큰'} 잔액 다시 조회`}
                    </button>

                    <hr />

                    <h2>토큰 승인 (Approve)</h2>
                    {/* 💡 Allowance 표시 문구 변경: 현재 입력된 주소에 대한 승인 금액을 보여주도록 */}
                    <p>현재 입력된 주소 ({approveAddress || '없음'}) 에 승인된 금액: {allowance !== null ? allowance : '조회 실패'}</p>
                    <p>(토큰을 사용하려는 컨트랙트 또는 지갑에 권한을 부여합니다.)</p>
                    <div>
                    <label>
                            승인할 대상 주소: {/* 💡 텍스트 변경 */}
                            <input
                                type="text"
                                value={approveAddress}
                                onChange={(e) => setApproveAddress(e.target.value)}
                                placeholder="0x... 승인할 주소"
                                disabled={approveLoading}
                            />
                        </label>
                    </div>
                    <div>

                        <label>
                            승인할 {tokenSymbol || '토큰'} 금액:
                            <input
                                type="number"
                                value={approveAmount}
                                onChange={(e) => setApproveAmount(e.target.value)}
                                disabled={approveLoading}
                            />
                        </label>
                        {/* 💡 approveAddress가 유효한 주소일 때만 버튼 활성화 */}
                        <p>
                        <button onClick={handleApprove} disabled={approveLoading || !ethers.isAddress(approveAddress)}>
                            {approveLoading ? '승인 중...' : `${tokenSymbol || '토큰'} 승인`}
                        </button>
                        </p>
                        {!ethers.isAddress(approveAddress) && approveAddress !== '' && (
                            <p style={{color: 'orange'}}>유효한 이더리움 주소를 입력해주세요.</p>
                        )}
                    </div>

                    <hr />

                    <h2>자산 획득 (Acquire)</h2>
                    <div>
                        <label>
                            획득할 자산을 받을 주소:
                            <input
                                type="text"
                                value={acquireRecipient}
                                onChange={(e) => setAcquireRecipient(e.target.value)}
                                placeholder="0x..."
                                disabled={acquireLoading}
                            />
                        </label>
                        <p>
                        <button onClick={handleAcquire} disabled={acquireLoading || !ethers.isAddress(acquireRecipient)}>
                            {acquireLoading ? '획득 중...' : '자산 획득 (Acquire)'}
                        </button>
                        </p>
                        {!ethers.isAddress(acquireRecipient) && acquireRecipient !== '' && (
                            <p style={{color: 'orange'}}>유효한 이더리움 주소를 입력해주세요.</p>
                        )}
                    </div>

                </div>
            )}
            {!account && !loading && (
                <p>지갑을 연결하여 DApp을 사용하세요.</p>
            )}
            
        </div>
    );
}

export default MyDapp;