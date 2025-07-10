import { ethers, BrowserProvider, Contract } from 'ethers';
import { useEffect, useState, useCallback } from 'react';
import FactoryJson from "../public/streamFactory.json";
import './index.css';

const FACTORY_ABI = FactoryJson.abi;
const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function initProvider(): Promise<BrowserProvider | null> {
    if(window.ethereum) {
        console.log("메타마스크 연결");
        return new BrowserProvider(window.ethereum);
    } else {
        console.log("메타마스크 연결 실패");
        return null;
    }
}

interface companyDetail {
    cid: string;        // string - bytes
    name: string;       // compnay name
    bbungfluid: string; // string - address
}

function FactoryApp() {
    const [provider, setProvider] = useState<BrowserProvider | null>(null); 
    const [account, setAccount] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    const [factoryReadContract, setFactoryReadContract] = useState<Contract | null>(null);
    const [factoryWriteContract, setFactoryWriteContract] = useState<Contract | any>(null);
    const [companyAddress, setCompanyAddress] = useState<string>('');
    const [companyInfo, setCompanyInfo] = useState<companyDetail>({
        cid: '',
        name: '',
        bbungfluid: ''
    });
    const [ownerAddress, setOwnerAddress] = useState<string>('');
    
    // register에 필요한 변수들
    const [registerCompany, setRegisterCompany] = useState<string>('');
    const [registerCid, setRegisterCid] = useState<string>('');
    const [registerName, setRegisterName] = useState<string>('');
    const [registerUSDC, setRegisterUSDC] = useState<string>('');

    const fetchCompanyInfo = useCallback(async() => {
        if(!factoryReadContract) return;
        try {
            const companyData = await factoryReadContract.companies(companyAddress);
            const cid = companyData.cid;
            const name = companyData.name;
            const bbungfluid = companyData.bbungfluid;

            setCompanyInfo({
                cid,
                name,
                bbungfluid
            });
        } catch(error) {
            console.log("fetchCompanyInfo Error:", error);
        }
    }, [factoryReadContract, companyAddress]);

    const loadRegister = useCallback(async() => {
        if(!factoryWriteContract || !registerCompany || !registerCid || !registerName || !registerUSDC) {
            alert("지갑이 연결되지 않았거나 register에 유효한 값이 아닙니다.");
            return;
        }
        try {
            const tx = await factoryWriteContract.register(
                registerCompany, 
                registerCid, 
                registerName, 
                registerUSDC
            );
            console.log("Register 트랜잭션 전송:", tx.hash);
            const receipt = await tx.wait(); // 트랜잭션이 블록에 포함될 때까지 대기

            if (receipt.status === 1) {
                console.log("트랜잭션 성공! 영수증:", receipt);
                console.log("블록 번호:", receipt.blockNumber);
            } else {
                console.error("트랜잭션 실패 (Reverted)! 영수증:", receipt);
            }
        } catch(err) {
            console.log("Register 실패:", err);
        }
    }, [factoryWriteContract, registerCompany, registerCid, registerName, registerUSDC]);

    useEffect(() => {
        const setupFactoryApp = async() => {

            try {
                const ethProvider = await initProvider();
                if(ethProvider) {
                    setProvider(ethProvider);

                    const accounts = await ethProvider.send("eth_requestAccounts", []);
                    if(accounts.length > 0) {
                        const connectedAccount = accounts[0];
                        setAccount(connectedAccount);
                        console.log("계정 연결 성공", connectedAccount);

                        const signer = await ethProvider.getSigner(connectedAccount);
                        const readContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, ethProvider);
                        const writeContract = readContract.connect(signer);
                        const owner = await readContract.owner();

                        setOwnerAddress(owner);
                        setFactoryReadContract(readContract);
                        setFactoryWriteContract(writeContract);
                        console.log("팩토리 컨트랙트 (읽기/쓰기) 인스턴스 준비 완료.");
                    } else {
                        setError("MetaMask 계정 연결이 필요합니다.");
                        setAccount(null);
                    }
                } 
            } catch(err: any) {
                console.error("DApp 초기화 또는 계정 연결 에러", err);
                setAccount(null);
            }
        };

        setupFactoryApp();

        if(window.ethereum) {
            const handleAccountsChanged = (accs: string[]) => {
                if(accs.length > 0) {
                    setAccount(accs[0]);
                    console.log("계정 변경됨", accs[0]);
                } else {
                    setAccount(null);
                    setError("지갑 연결이 해제되었습니다.");
                    console.log("지갑 연결 해제됨.");
                }
            }

            const handleChainChanged = (chainId: string) => {
                console.log("네트워크 변경 감지. 새로운 체인 ID:", parseInt(chainId, 16));
                setProvider(null);
                setAccount(null);
                setFactoryReadContract(null);
                setFactoryWriteContract(null);
                setCompanyAddress('');
                setOwnerAddress('');
            }

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
        if (factoryReadContract) {
            fetchCompanyInfo();
        }
    }, [factoryReadContract, fetchCompanyInfo]);

    return (
        <div>
            <h1>
                Stream Factory
            </h1>
            <p>Owner: {ownerAddress}</p>
        <div className="container">
            <h3>Register</h3>
            <input
                type="text"
                value={registerCompany}
                onChange={(e) => setRegisterCompany(e.target.value)}
                placeholder="Enter company address"
            />
            <div>
            <input
                type="text"
                value={registerCid}
                onChange={(e) => setRegisterCid(e.target.value)}
                placeholder="Enter CID"
            />
            </div>
            <div>
            <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Enter Name"
            />
            </div>
            <div>
            <input
                type="text"
                value={registerUSDC}
                onChange={(e) => setRegisterUSDC(e.target.value)}
                placeholder="Enter USDC"
            />
            </div>
            <div>
            <button onClick={loadRegister}>Register Company</button>
            </div>
        </div>
        <div className="container">
            <h4>Company Info</h4>
            <input 
                type="text" 
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)} 
                placeholder="Enter company address" 
            />
            <div>
                <p>Company ID: {companyInfo.cid}</p>
                <p>Name: {companyInfo.name}</p>
                <p>Address: {companyInfo.bbungfluid}</p>
            </div>
        </div>
        </div>
    );
}

export default FactoryApp;