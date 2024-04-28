'use client'
import { useState } from "react";
import { ContractFactory, ethers } from "ethers";
import tokenJson from "./token.json"
require("dotenv").config()

export default function Home() {

  const [tokenData, setTokenData] = useState({
    name: "",
    ticker: "",
    decimals: 0,
    totalSupply: 0
  });
  const [deploying, setDeploying] = useState(false)
  const [deployment, setDeployment] = useState(undefined)
  const [error, setError] = useState(false)

  const handleInputChange = e => {
    const { name, value } = e.target;
    setTokenData({
      ...tokenData, 
      [name]: value
    });
  }

  const deployToken = async () => {
    console.log('deploy token')
    console.log(tokenData)

    // 1. Connect to Metamask with Ethers
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    setDeploying(true);
    // App <=> Metamask <=> Blockchain

    // 2. Create the deployment transaction
    const token = new ContractFactory(tokenJson.abi, tokenJson.bytecode)
    const tx = await token.getDeployTransaction(
      tokenData.name,
      tokenData.ticker,
      tokenData.decimals,
      ethers.parseUnits(tokenData.totalSupply.toString(), parseInt(tokenData.decimals))
    );
    const txRequest = {
      data: tx.data
    }
    // 3. Send the transaction
    let txReceipt;
    try{
      const txResponse = await signer.sendTransaction(txRequest)
      txReceipt = await txResponse.wait();
      setDeploying(false);
      setDeployment({hash: txReceipt.hash, gas: txReceipt.gas, address: txReceipt.contractAddress})

    }catch(e){
      setDeploying(false);
      setError(true);
    }

    // 4 . Verify the contract

    const abiCoder = new ethers.AbiCoder();
    const constructorArguements = abiCoder.encode(
      ["string", "string", "uint8", "uint256"],
      [tokenData.name, tokenData.ticker, tokenData.decimals, tokenData.totalSupply]
    )
    const response = await fetch(
      "//api-sepolia.etherscan.io/api",
      {
        method: "POST",
        headers:{
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: {
          apiKey: process.env.API_KEY,
          module: 'contract',                             //Do not change
          action: 'verifysourcecode',                     //Do not change
          contractaddress: txReceipt.address,   //Contract Address starts with 0x...     
          sourceCode: tokenJson.code,             //Contract Source Code (Flattened if necessary)           //solidity-single-file (default) or solidity-standard-json-input (for std-input-json-format support
          contractname: "ERC20Token",         //ContractName (if codeformat=solidity-standard-json-input, then enter contractname as ex: erc20.sol:erc20)
          compilerversion: tokenJson.compilerVersion,   // see https://basescan.org/solcversions for list of support versions
          optimizationUsed: 0, //0 = No Optimization, 1 = Optimization used (applicable when codeformat=solidity-single-file)                                   //set to 200 as default unless otherwise  (applicable when codeformat=solidity-single-file)        
          constructorArguements: constructorArguements,   //if applicable
          evmversion: tokenJson.evmVersion,             //leave blank for compiler default, homestead, tangerineWhistle, spuriousDragon, byzantium, constantinople, petersburg, istanbul (applicable when codeformat=solidity-single-file)
          licenseType: tokenJson.licenseType, 

        }
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
              Congrats! The meme coin was deployed at <a href={`https://sepolia.basescan.org/tx/${deployment.hash}`} target="_blank">
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
