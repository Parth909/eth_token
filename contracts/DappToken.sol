// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract DappToken {
    string public name = "DApp Token";
    string public symbol = "DAPP";
    // not part of ERC20 standard
    string public standard = "DApp Token v1.0";
    uint256 public totalSupply;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    // getter funcs => for PUBLIC vars & mapping
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // === Constructor
    constructor(uint256 _initialSupply) public {
        totalSupply = _initialSupply;
        // allocate the entire supply to the administrator when SC is deplyed
        balanceOf[msg.sender] = _initialSupply;
    }

    // === Transfer
    function transfer(address _to, uint256 _value)
        public
        returns (bool success)
    {
        // Exception if account doesn't have enough otherwise throw an ERROR
        require(balanceOf[msg.sender] >= _value);

        // Transfer the balance
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        // Transfer Event even for 0 value
        emit Transfer(msg.sender, _to, _value);

        // Returns a boolean
        return true;
    }

    // === Delegated Transfer
    // approve function
    // transferFrom function
    // allowance public var
    // Approval Event

    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        // `allowance` - Instead of using a `function` like mentioned in Standard we will use a `mapping`
        allowance[msg.sender][_spender] = _value;

        // handle `approve Event`
        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        // Require _from has enough tokens
        require(_value <= balanceOf[_from]);

        // Require allowance is big enough
        require(_value <= allowance[_from][msg.sender]);

        // Change the balance
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;

        // Update the allowance
        allowance[_from][msg.sender] -= _value;

        // Transfer Event
        emit Transfer(_from, _to, _value);

        return true;
    }
}
