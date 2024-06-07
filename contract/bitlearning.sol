// SPDX-License-Identifier: Unlicense
pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

 interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract DecentrilizedTutors {

    uint256 internal _index;
    event NewTutor (
        address payable,
        string,
        string,
        string[],
        uint,
        string
    );
    event ProfileMade(string msg);

    struct Tutor {
        bool isTutor;
        address payable tutorId;
        string fullName;
        string sex;
        string[] subjects;
        uint age;
        string bio;
        uint rate;
        uint rating;
    }

    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    mapping (uint => Tutor) tutors;

    constructor ()
    {
        _index = 0;
    }

    function _createTutor(
        string memory _fullName,
        string memory _sex,
        string[] memory _subjects,
        uint _age,
        string memory _bio
    ) public {

        uint _rating = 0;
        uint _rate = 1;
        tutors[_index] = Tutor(
            true,
            payable(msg.sender),
            _fullName,
            _sex,
            _subjects,
            _age,
            _bio,
            _rate,
            _rating
        );
        _index++;
        string memory mssg = "New profile created!";
        emit ProfileMade(mssg);
    }

    function getTutor(uint256 _index) public returns(
        address payable,
        string memory,
        string memory,
        string[] memory,
        uint,
        string memory
        ) {
        emit NewTutor(
            tutors[_index].tutorId,
            tutors[_index].fullName,
            tutors[_index].sex,
            tutors[_index].subjects,
            tutors[_index].age,
            tutors[_index].bio
        );
        return (
            tutors[_index].tutorId,
            tutors[_index].fullName,
            tutors[_index].sex,
            tutors[_index].subjects,
            tutors[_index].age,
            tutors[_index].bio
        );
    }

    function bookTutor(uint _index) public payable {

        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                tutors[_index].tutorId,
                tutors[_index].rate
            ),
            "Transfer Failed!"
        );
        tutors[_index].rating++;
    }

}