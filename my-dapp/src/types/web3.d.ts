// src/types/web3.d.ts
import { MetaMaskInpageProvider } from "@metamask/providers"; // MetaMask Inpage Provider 타입 임포트 (선택 사항이지만 권장)
// 또는 import { Eip1193Provider } from "ethers"; // EIP-1193 Provider 타입 임포트 (더 일반적)

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider | any; // MetaMaskInpageProvider 타입을 사용하거나, 간단히 any로 선언
    // 또는 ethereum?: Eip1193Provider | any; // EIP-1193 호환 Provider 타입 사용
  }
}