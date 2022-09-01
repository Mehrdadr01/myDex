// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {

    // 
    address public feeAccount;
    uint256 public feePercent ;
    uint256 public orderCounter;
    mapping (address => mapping (address => uint256)) public tokens;
    //       token add            usr add   how many token deposited
    mapping(uint256 => _Order)public orders;
    mapping (uint256 => bool) public cancelledOrders;
    mapping (uint256 => bool) public FilledOrders;

    event Deposit(address _token, address _user,uint256 _amount,uint256 _balance );
    event Withdraw(address _token, address _user, uint256 _amount, uint256 _balance);
    event Order(uint256 _id, address _user, address _tokenGet, uint256 _amountGet,address _tokenGive, uint256 _amountGive,uint256 _timestamp);
    event Cancel(uint256 _id, address _user, address _tokenGet, uint256 _amountGet,address _tokenGive, uint256 _amountGive,uint256 _timestamp);
    event Trade(uint256 _id, address _user, address _tokenGet, uint256 _amountGet,address _tokenGive, uint256 _amountGive,address _creator,uint256 _timestamp);
    
        
    struct _Order {
        uint256 id ;// uniuqe id
        address user; // user that make the order
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp; // time of odre creation 
    }
    constructor(address _feeAccount, uint256 _feePercent){

        feeAccount = _feeAccount ;
        feePercent = _feePercent ;
    }

                 //-------------------------//
                //----- DEPOSIT TOKEN -----//

    function depositToken(address _token, uint256 _amount) public {
        // transfer token to exchange 

        // using reqiure for debuging and reeor handling 
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        // update user balance 
        tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount ;

        // emite an event 
        emit Deposit(_token, msg.sender, _amount,tokens[_token][msg.sender]);
    }
                 //-------------------------//
                //----- WITHDRAW TOKEN ----//

    function withdrawToken(address _token, uint256 _amount) public {

        // ensure user has enough token to withdraw 
        require(tokens[_token][msg.sender] >= _amount); 
        
        //transfer token to user

        Token(_token).transfer(msg.sender, _amount);
        
        // update user balance 
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount ;
        
        // emit an event
        emit Withdraw(_token,msg.sender,_amount,tokens[_token][msg.sender]);

    }
    function balanceOf(address _token, address _user) public view returns(uint256){
        
        return tokens[_token][_user];
    }

                 //------------------------------//
                //----- MAKE & CANCEL ORDER ----//

    // token give() is the to wanto to sell  , which token how much 
    // token get() is the token want to buy 
    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
        // token give() is the to wanto to sell  , which token how much 
        // token get() is the tok   en want to buy 
        // requre token balnce 
        require(balanceOf(_tokenGive,msg.sender) >= _amountGive);
        // creating order
        orderCounter++;
        orders[orderCounter] =  _Order(orderCounter,msg.sender,_tokenGet,_amountGet,_tokenGive,_amountGive,block.timestamp);

        // emiting an event 
        emit Order(orderCounter,msg.sender,_tokenGet,_amountGet,_tokenGive,_amountGive,block.timestamp);

    }

    function cancelOrder(uint256 _id) public{
        // fetch the order 
        _Order storage _order = orders[_id];
       
        // make sure user canclling order owns the order 
        require(address(_order.user) == msg.sender); // caller of the cancelorder owns the order 
        // order must exist befor deletion DUH :D
        require(_order.id == _id);
         
         // cancel the order
        cancelledOrders[_id] = true;
        // emit the cancel event 
         emit Cancel(_order.id,msg.sender,_order.tokenGet,_order.amountGet,_order.tokenGive,_order.amountGive,block.timestamp);

    }   


                 //--------------------------//
                //----- EXECUTING ORDER ----//

    function fillOrder(uint256 _id) public {
      
        // must be valid orderid
        require(_id >=0 && _id <= orderCounter ,'Order does not exist :('); 
        // order cant be filled ( FilledOrders ) 
        require(!FilledOrders[_id]);
        // order cant be cancel ( CancelledOrders )
        require(!cancelledOrders[_id],' GI DE SELAY ');
      
      
      
        // first we fetch the order because we trade of a existing order 
        _Order storage _order = orders[_id];
    
        // excute the trade 
        _trade(_order.id,
               _order.user,
               _order.tokenGet,
               _order.amountGet,
               _order.tokenGive,
               _order.amountGive);

        // mark ourder as fiiled
        FilledOrders[_order.id] = true;
    }
    function _trade(uint256 _orderID, address _user,address _tokenGet, uint256 _amountGet,address _tokenGive,uint256 _amountGive) internal{


            // calculating the fee
            // fee is paid by the user the fills the trade in this case user2
            // and it deducted from amountGet
            uint256 _feeAmount = (_amountGet * feePercent) / 100;


            // we use tokenget for user2 that want to fill the order that because user2 calling the func (fills order ) is msg.sender 
            // why use tokenGet beacase user1 create the order and want to get tokenGet that user 2 has
            tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender] - (_amountGet + _feeAmount);
            tokens[_tokenGet][_user] = tokens[_tokenGet][_user] + _amountGet ; 

            // charging fee 

            tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount] + _feeAmount;

            // then we added to usser1 that create the order the amount we substrac from user2 

            tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive; 
            tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender] + _amountGive ; 


            // emit trade event 
           //  emit Cancel(_orderID,msg.sender,_tokenGet,_amountGet,_tokenGive,_amountGive,block.timestamp);
            emit Trade(_orderID,msg.sender,_tokenGet,_amountGet,_tokenGive,_amountGive,_user,block.timestamp);
            

    }
 


}
