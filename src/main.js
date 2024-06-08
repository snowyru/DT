import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";

import bitlearningAbi from "../contract/bitlearning.abi.json";
import erc20Abi from "../contract/erc20.abi.json";

const ERC20_DECIMALS = 18;
const DTContractAddress = "0x9C87a0EeA7561ED90833E62Bdc1d9560761235aC";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

let kit;
let contract;
let tutors = [];

// Temp tutors
tutors = [
  {
    index: 0,
    tutorId: "1",
    fullName: "Jane Doe",
    sex: "Female",
    subjects: ["Mathematics", "Physics"],
    age: "29",
    bio: "Passionate about teaching and helping students achieve their full potential. With a Master's degree in Physics and over 5 years of tutoring experience, I bring both knowledge and practical teaching skills to the table.",
  },
  {
    index: 1,
    tutorId: "2",
    fullName: "John Smith",
    sex: "Male",
    subjects: ["Chemistry", "Biology"],
    age: "32",
    bio: "Dedicated and experienced tutor with a PhD in Chemistry. I've been tutoring high school and college students for 7 years, focusing on making complex concepts accessible and understandable.",
  },
];
renderTutors();

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();
      notificationOff();

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(bitlearningAbi, DTContractAddress);
      console.log("wallet loaded");
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods
    .approve(DTContractAddress, _price)
    .send({ from: kit.defaultAccount });
  return result;
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  document.querySelector("#balance").textContent = cUSDBalance;
  console.log("got the balance");
};

const getTutors = async function () {
  const tutorsLength = await contract.methods.getTotalTutors().call();
  const _tutors = [];
  console.log("there are " + tutorsLength + " tutors.");

  for (let i = 0; i < tutorsLength; i++) {
    let _tutor = new Promise(async (resolve, reject) => {
      let t = await contract.methods.getTutor(i).call();
      resolve({
        index: i,
        tutorId: t[0],
        fullName: t[1],
        sex: t[2],
        subjects: t[3],
        age: t[4],
        bio: t[5],
      });
    });
    _tutors.push(_tutor);
  }
  tutors = await Promise.all(_tutors);
  renderTutors();
};

function renderTutors() {
  const marketplace = document.getElementById("marketplace");
  marketplace.innerHTML = "";

  if (tutors.length === 0) {
    marketplace.innerHTML = "<p>No tutors available at the moment.</p>";
    return;
  }

  tutors.forEach((_tutor) => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = tutorTemplate(_tutor);
    marketplace.appendChild(newDiv);
  });
}

function tutorTemplate(_tutor) {
  return `
    <div class="card mb-4">
      <div class="card-body text-left p-4 position-relative">
        <h2 class="card-title fs-4 fw-bold mt-2">${_tutor.fullName}</h2>
        <p class="card-text mb-4">${_tutor.bio}</p>
        <p class="card-text"><strong>Sex:</strong> ${_tutor.sex}</p>
        <p class="card-text"><strong>Subjects:</strong> ${_tutor.subjects.join(", ")}</p>
        <p class="card-text"><strong>Age:</strong> ${_tutor.age}</p>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark bookBtn fs-6 p-3" id=${_tutor.index}>Book for 1 cUSD</a>
        </div>
      </div>
    </div>
  `;
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

window.addEventListener("load", async () => {
  console.log("Im loading...");
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getTutors();
  notificationOff();
});

document.querySelector("#newTutorBtn").addEventListener("click", async (e) => {
  const subjects = document.getElementById("newSubjects").value.split(",").map(subject => subject.trim());
  const params = [
    document.getElementById("newFullName").value,
    document.getElementById("newSex").value,
    subjects,
    parseInt(document.getElementById("newAge").value),
    document.getElementById("newBio").value,
  ];
  notification(`⌛ Adding "${params[0]}"...`);
  try {
    await contract.methods._createTutor(...params).send({ from: kit.defaultAccount });
    notification(`🎉 You successfully added "${params[0]}".`);
    getTutors();
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
});

document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("bookBtn")) {
    const index = e.target.id;
    notification("⌛ Waiting for payment approval...");
    try {
      await approve(new BigNumber(1).shiftedBy(ERC20_DECIMALS));
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
    notification(`⌛ Booking tutor "${tutors[index].fullName}"...`);
    try {
      await contract.methods.bookTutor(index).send({ from: kit.defaultAccount });
      notification(`🎉 You successfully booked "${tutors[index].fullName}".`);
      getTutors();
      getBalance();
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  }
});
