import React from "react";
import styled from "styled-components";
import { darkenColor } from "./shared.js";
const ButtonWrapper = styled.div`
  display: flex;
`;

const StatusButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 75px;
  height: 35px;
  border: 1px solid grey;
  border-radius: 4px;
  font-weight: 100;
  color: white;
  ${props =>
    props.selected
      ? `-webkit-box-shadow: inset 0px 0px 5px #c1c1c1;
     -moz-box-shadow: inset 0px 0px 5px #c1c1c1;
          box-shadow: inset 0px 0px 5px #c1c1c1;
          font-weight: bold;
          `
      : ""};
`;

const GreenButton = styled(StatusButton)`
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  background-color: #339966;
  ${props =>
    props.selected ? "background-color:" + darkenColor("#339966") : ""};
`;

const YellowButton = styled(StatusButton)`
  border-radius: 0;
  background-color: #339966;
  ${props =>
    props.selected ? "background-color:" + darkenColor("#339966") : ""};
`;

const RedButton = styled(StatusButton)`
  border-radius: 0;
  background-color: #339966;
  ${props =>
    props.selected ? "background-color:" + darkenColor("#339966") : ""};
`;

const BlackButton = styled(StatusButton)`
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  background-color: #339966;
  ${props =>
    props.selected ? "background-color:" + darkenColor("#339966") : ""};
`;
export class PatientStatusButton extends React.PureComponent {
  changePatientStatus = color => {
    if (color === this.props.healthStatus) {
      this.props.changePatientStatus(this.props.id, "");
    }
    this.props.changePatientStatus(this.props.id, color);
  };

  render() {
    const selectedButtonColor = this.props.healthStatus || "";

    return (
      <ButtonWrapper>
        <GreenButton
          selected={selectedButtonColor === "green"}
          onClick={() => this.changePatientStatus("green")}
        >
          Green
        </GreenButton>
        <YellowButton
          selected={selectedButtonColor === "yellow"}
          onClick={() => this.changePatientStatus("yellow")}
        >
          Yellow
        </YellowButton>
        <RedButton
          selected={selectedButtonColor === "red"}
          onClick={() => this.changePatientStatus("red")}
        >
          Red
        </RedButton>
        <BlackButton
          selected={selectedButtonColor === "black"}
          onClick={() => this.changePatientStatus("black")}
        >
          Black
        </BlackButton>
      </ButtonWrapper>
    );
  }
}
