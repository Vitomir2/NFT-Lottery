// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * @author Vitomir
 * @title NFT Lottery Ticket
 * @notice contract that is used for lottery - people mint tickets and then a random winner is chosen
 */
contract NFTLottery is ERC721Upgradeable, AccessControlUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    /// @notice Keep track of the token id's
    CountersUpgradeable.Counter private _tokenIds;

    /// @notice The time when the sale must start
    uint256 public startAt;

    /// @notice The time when the sale must end
    uint256 public endAt;

    /// @notice The price for each ticket
    uint256 public ticketPrice;

    /// @notice List of participants by lottery
    address[] public participants;

    /// @notice The surprise winner that will be chosen randomly during the lottery
    address public surpriseWinner;

    /// @notice The final lottery winner that will be chosen randomly during the lottery
    address public lotteryWinner;

    //--- Events ---
    event UserEnteredLottery(uint256 _tokenId, address _user, uint256 _price);
    event TicketPriceIsSet(uint256 _price);
    event LotteryStarted(uint256 _startAt, uint256 _endAt);
    event LotteryEnded(address _lotteryWinner);
    event SurpriseWinnerAwarded(address _surpriseWinner);

    //--- Modifiers ---
    /**
     * @notice Function modifier to that the lottery has started
     */
    modifier startedLottery() {
        require(block.timestamp >= startAt && block.timestamp <= endAt, "NFTLottery: The lottery is not open");
        _;
    }

    //--- Functions ---
    /**
     * @notice Contract initializer
     * @dev This function is used to initialize the upgradeable contract and the inherited OZ contracts (used instead of constructor)
     * @param _name string for the name of the lottery NFT
     * @param _symbol string for the symbol of the lottery NFT
     */
    function initialize(string memory _name, string memory _symbol) external initializer {
        __ERC721_init(_name, _symbol);
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        ticketPrice = 0.1 ether;
    }

    /**
     * @notice Function that helps a user to enter the lottery
     * @dev Function checks if the lottery is activated and if the sender has enough funds.
     * Then, an NFT is minted for the user which is 1 entry in the lottery.
     */
    function enterLottery() external payable startedLottery {
        require(msg.value >= ticketPrice, "NFTLottery: msg.value < ticketPrice");

        uint256 newTicketId = _tokenIds.current();
        _safeMint(msg.sender, newTicketId);
        _tokenIds.increment();

        participants.push(msg.sender);

        emit UserEnteredLottery(newTicketId, msg.sender, msg.value);
    }

    /**
     * @notice Sets the price for one lottery ticket
     * @param _price Price for the ticket
     */
    function setTicketPrice(uint256 _price) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_price > 0, "NFTLottery: _price == 0");
        ticketPrice = _price;
        emit TicketPriceIsSet(_price);
    }

    /**
     * @notice Starts the Lottery
     * @dev This functions is used to start the NFT lottery
     * @param _startAt timestamp to set when the lottery should start
     * @param _endAt timestamp to set when the lottery should end
     */
    function startLottery(uint256 _startAt, uint256 _endAt) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_startAt > 0, "NFTLottery: _startAt == 0");
        require(_endAt > _startAt, "NFTLottery: End time should be after the start time");

        startAt = _startAt;
        endAt = _endAt;
        
        delete participants;
        surpriseWinner = address(0);
        lotteryWinner = address(0);

        emit LotteryStarted(_startAt, _endAt);
    }

    /**
     * @notice Ends the Lottery
     * @dev This functions is used to end the NFT lottery if the end time is passed
     */
    function endLottery() public {
        require(block.timestamp > endAt, "NFTLottery: The Lottery time is not finished");
        
        //! Not a good practice to make loops in the contract, but that was the easier way to choose different winner
        //! another option was to delete all records for the winner from the participants array
        uint256 winnerIndex = 0;
        while (lotteryWinner == surpriseWinner) {
            winnerIndex = random();
            lotteryWinner = participants[winnerIndex];
        }

        lotteryWinner = participants[winnerIndex];
        payable(lotteryWinner).transfer(address(this).balance);

        emit LotteryEnded(lotteryWinner);
    }

    /**
     * @notice Awards a random surprise winner during the lottery
     * @dev This functions takes a random surprise winner from the participants and award it with 50% of the prize pool
     */
    function awardSurpriseWinner() public startedLottery {
        require(participants.length != 0, "NFTLottery: no participants in the lottery");
        require(surpriseWinner == address(0), "NFTLottery: cannot reward twice during the lottery");

        uint256 winnerIndex = random();
        surpriseWinner = participants[winnerIndex];
        payable(surpriseWinner).transfer(address(this).balance / 2);

        emit SurpriseWinnerAwarded(surpriseWinner);
    }

    /**
     * @notice Returns a random winner from all the participants
     * @dev First it calculates a random integer using keccak256 with the block difficulty, the block timestamp and the addresses of the participants.
     * Then, it calculates the index by taking the remainder by using the modulo %
     * @return uint256 index of the chosen winner
     */
    function random() private view returns(uint256) {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, participants)));
        return rand % participants.length;
    }

    //--- Getters ---
    /// @notice Return the ETH balance of the contract
    function getETHBalance() public view returns(uint256) {
        return address(this).balance;
    }

    //--- Overrides ---
    /// @notice Required to override because of the AccessControlUpgradeable inheritance
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
