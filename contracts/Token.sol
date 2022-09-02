// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";   

contract Token{
    string public name ;//= "Mehrdad";
    string public symbol ;//= "MRD" ; 
    uint256 public decimals = 18 ; // standard for ERC20 tokens
    uint256 public totalSupply;// = 1000000 * (10**decimals);
    // need 2 arrays for our ER20 token
    mapping(address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value);
    event Approval(
        address indexed _owner, 
        address indexed _spender, 
        uint256 _value);

    constructor(string memory _name, string memory _symbol, uint256  _totalSupply){
        name = _name ;
        symbol =_symbol;
        totalSupply = _totalSupply *(10**decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function _transfer(address _from,address _to, uint256 _value) internal {
        require(_to != address(0));
        
        balanceOf[_from]= balanceOf[_from]- _value;
        balanceOf[_to] = balanceOf[_to] + _value;

        emit Transfer(_from,_to,_value);
    }
    
    
    function transfer(address _to, uint256 _value) public  returns (bool seccess) {
        
        // check to if sender have enough toke bnto spend 
        require(balanceOf[msg.sender] >= _value);
       
       _transfer(msg.sender, _to,_value);
       
       // require(_to != address(0));
        //balanceOf[msg.sender] = balanceOf[msg.sender] - _value ;
        //balanceOf[_to] = balanceOf[_to] + _value ;
        // emit Transfer(msg.sender, _to,_value);
        return true;
    }

    function approve(address _spender , uint256 _value) public returns(bool seccess){

        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value ;   

        emit Approval(msg.sender, _spender,_value);

        return true;  

    }
    function transferFrom(address _from, address _to, uint256 _value) public returns(bool seccess){

        // check approval 
        require(_value <=  balanceOf[_from]);
        require(_value <= allowance[_from][msg.sender]);
        
        // rest allownce 
        allowance[_from][msg.sender] = allowance[_from][msg.sender] - _value ;


        //apend token 
        _transfer(_from,_to,_value);
        return true;
    }
}

