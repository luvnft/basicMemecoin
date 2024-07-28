'use client';
import { useState } from "react";
import { ContractFactory, ethers } from "ethers";
import tokenJson from "./token.json";
require("dotenv").config();

export default function Home() {

  const [tokenData, setTokenData] = useState({
    name: "",
    ticker: "",
    decimals: 0,
    totalSupply: 0
  });
  const [deploying, setDeploying] = useState(false);
  const [deployment, setDeployment] = useState(undefined);
  const [error, setError] = useState(false);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setTokenData({
      ...tokenData, 
      [name]: value
    });
  }

  const deployToken = async () => {
    console.log('deploy token');
    console.log(tokenData);

    // 1. Connect to Metamask with Ethers
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    setDeploying(true);
    // App <=> Metamask <=> Blockchain

    // 2. Create the deployment transaction
    const token = new ContractFactory(tokenJson.abi, tokenJson.bytecode, signer);
    const tx = await token.getDeployTransaction(
      tokenData.name,
      tokenData.ticker,
      tokenData.decimals,
      ethers.utils.parseUnits(tokenData.totalSupply.toString(), parseInt(tokenData.decimals))
    );

    // 3. Send the transaction
    let txReceipt;
    try {
      const txResponse = await signer.sendTransaction({ ...tx });
      txReceipt = await txResponse.wait();
      setDeploying(false);
      setDeployment({ hash: txReceipt.transactionHash, gas: txReceipt.gasUsed.toString(), address: txReceipt.contractAddress });

    } catch (e) {
      setDeploying(false);
      setError(true);
    }

    // 4. Verify the contract
    const abiCoder = new ethers.utils.AbiCoder();
    const constructorArguments = abiCoder.encode(
      ["string", "string", "uint8", "uint256"],
      [tokenData.name, tokenData.ticker, tokenData.decimals, tokenData.totalSupply]
    );

    const response = await fetch(
      `https://api.etherscan.io/api`,
      {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: process.env.API_KEY,
          module: 'contract',
          action: 'verifysourcecode',
          contractaddress: txReceipt.contractAddress,
          sourceCode: tokenJson.code,
          contractname: "ERC20Token",
          compilerversion: tokenJson.compilerVersion,
          optimizationUsed: 0,
          constructorArguements: constructorArguments,
          evmversion: tokenJson.evmVersion,
          licenseType: tokenJson.licenseType,
        })
      }
    );
  }

  return (
    <div className="container-fluid mt-5 d-flex justify-content-center">
      <div id="content" className="row">
        <div id="content-id" className="col">
          <div className="text-center">
            <h1 id="title" className="fw-bold"> MEME COIN GENERATOR</h1>
            <p id="sub-title" className="mt-4 fw-bold"> <span> Generate your meme coin in 1 minute <br/> without any coding! </span></p>
          </div>

          <h2 className="fs-5 mt-4 fw-bold">Metadata</h2>
          <div className="form-group"> 
            <label>Token Name</label>
            <input type="text" className="form-control" placeholder="Enter token name" name="name" value={tokenData.name} onChange={handleInputChange}/>
          </div>

          <div className="form-group"> 
            <label>Token Ticker</label>
            <input type="text" className="form-control" placeholder="Ticker" name="ticker" value={tokenData.ticker} onChange={handleInputChange} />
          </div>

          <h2 className="fs-5 mt-4 fw-bold">Tokenomics</h2>
          <div className="form-group"> 
            <label>Decimals</label>
            <input type="number" className="form-control" placeholder="Decimals" name="decimals" value={tokenData.decimals} onChange={handleInputChange} />
          </div>

          <div className="form-group"> 
            <label>Total Supply</label>
            <input type="number" className="form-control" placeholder="Total Supply" name="totalSupply" value={tokenData.totalSupply} onChange={handleInputChange} />
          </div>

          <button className="btn btn-primary mt-4" onClick={deployToken} disabled={deploying}>Deploy Token</button>
          {deploying && 
            <div className="alert alert-info mt-4 mb-0">
              Your meme coin is being deployed. Please wait until the transaction is mined.
            </div>
          } 

          {deployment && 
            <div className="alert alert-success mt-4 mb-0">
              Congrats! The meme coin was deployed at <a href={`https://etherscan.io/tx/${deployment.hash}`} target="_blank">
              {`${deployment.hash.substr(0, 20)}...`}
              </a>
            </div>
          } 

          {error && <div className="alert alert-danger mt-4 mb-0">Ooops.. There was a problem. Your meme coin was not deployed. Please try again later.</div>}
            
          
        </div>
      </div>
    </div>
  );
}
