import React from "react";
import propTypes from "prop-types";

const Account = ({ username, joinedDate, allTask }) => {
  return (
    <div className="account">
      <div className="user-picture">
        <div className="picture-container">
          <img
            src="https://images.unsplash.com/photo-1623800184143-bd1c73967392?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=401&q=80"
            alt="test"
            className="profile-picture"
            title={username + " picture"}
          />
        </div>
      </div>
      <ul className="user-info">
        <li className="user-info-option info-1">{username}</li>
        <li className="user-info-option info-2">{joinedDate}</li>
        <li className="user-info-option info-3">{allTask}</li>
      </ul>
    </div>
  );
};

Account.propTypes = {
  username: propTypes.string,
  joinedDate: propTypes.string,
  allTask: propTypes.number,
};

export default Account;
