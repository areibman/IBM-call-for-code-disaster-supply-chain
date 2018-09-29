import React from "react";

import "./PatientList.css";
import Dialog from "material-ui/Dialog";
import { PatientStatusButton } from "./PatientStatusButton";
import {
  ItemContainer,
  ItemLabel,
  ItemButton,
  Input,
  LabeledInfo,
  Buttons
} from "./shared";

class PatientList extends React.Component {
  state = {
    open: false,
    activepatientId: "",
    oldName: "",
    oldSupplyName: "",
    oldSupplyAmount: "",
    oldPatientLocation: "",
    newName: "",
    supplyName: "",
    supplyAmount: "",
    search: "",
    location: { value: "", label: "" }
  };

  handleOpen = (
    patientId,
    patientName,
    patientSupplyName,
    patientSupplyAmount,
    patientLocation
  ) => {
    this.setState({
      open: true,
      activepatientId: patientId,
      newName: patientName,
      supplyName: patientSupplyName,
      supplyAmount: patientSupplyAmount,
      location: { value: patientLocation, label: patientLocation }
    });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleSubmit = e => {
    this.props.refreshPatientListItems();
    this.props.editPatientFunc(
      this.state.activepatientId,
      this.state.newName,
      this.state.supplyName,
      this.state.supplyAmount,
      this.state.location.label
    );
    this.handleClose();
  };

  changeLocation = location => {
    this.setState({ location: location });
  };

  updateName = e => {
    this.setState({ newName: e.target.value });
  };

  updateSupplyName = e => {
    this.setState({ supplyName: e.target.value });
  };

  updateSupplyAmount = e => {
    this.setState({ supplyAmount: e.target.value });
  };

  searchChange = e => {
    this.setState({ search: e.target.value });
  };

  render() {
    const actions = [
      <ItemButton title="Cancel" primary={true} onClick={this.handleClose}>
        Cancel
      </ItemButton>,
      <ItemButton
        title="Submit"
        primary={true}
        keyboardFocused={true}
        onClick={this.handleSubmit}
      >
        Submit
      </ItemButton>
    ];

    console.log(this.props.patientListItems);

    const items = this.props.patientListItems.map(item => {
      if (this.state.search) {
        if (!item.name.includes(this.state.search)) {
          return null;
        }
      }

      return (
        <ItemContainer key={item._id}>
          <ItemLabel>
            Patient Name: <LabeledInfo>{item.name}</LabeledInfo>
          </ItemLabel>
          <ItemLabel>Location: {this.props.location}</ItemLabel>
          <ItemLabel>
            Status:{"  " + item.healthStatus}
            <PatientStatusButton
              healthStatus={item.healthStatus}
              changePatientStatus={this.props.changePatientStatus}
              id={item._id}
            />
          </ItemLabel>
          <ItemLabel>
            Supply Name {item.supplyName}
            <br />
            Supply Amount {item.supplyAmount}
          </ItemLabel>
          <ItemLabel>
            <input
              onChange={() => this.props.changeStatusPublicity(item._id)}
              type="checkbox"
              checked={item.statusPublic}
            />
            {"  "}Status Public
          </ItemLabel>
          <ItemLabel>
            <input
              onChange={() => this.props.changeLocationPublicity(item._id)}
              type="checkbox"
              checked={item.locationPublic}
            />
            {"  "}Location Public
          </ItemLabel>
          <Buttons>
            <ItemButton onClick={() => this.props.deleteFunc(item._id)}>
              Remove Patient
            </ItemButton>
            <ItemButton
              onClick={() =>
                this.handleOpen(
                  item._id,
                  item.name,
                  item.supplyName,
                  item.supplyAmount,
                  item.location
                )
              }
            >
              Edit Patient
            </ItemButton>
          </Buttons>
        </ItemContainer>
      );
    });

    return (
      <div>
        Search Patients:<Input
          value={this.state.search}
          onChange={this.searchChange}
        />
        <div>{items}</div>
        <Dialog
          title="Edit Patient"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
        >
          <ItemLabel>
            Name
            <Input
              className="form-control"
              type="text"
              id="textfield-item-rename"
              defaultValue={this.state.newName}
              onChange={this.updateName}
              fullWidth={true}
            />
          </ItemLabel>
          <ItemLabel>
            Supply name
            <Input
              className="form-control"
              type="text"
              id="textfield-item-rename"
              defaultValue={this.state.supplyName}
              onChange={this.updateSupplyName}
              fullWidth={true}
            />
          </ItemLabel>
          <ItemLabel>
            Supply amount
            <Input
              className="form-control"
              type="text"
              id="textfield-item-rename"
              defaultValue={this.state.supplyAmount}
              onChange={this.updateSupplyAmount}
              fullWidth={true}
            />
          </ItemLabel>
        </Dialog>
      </div>
    );
  }
}

export default PatientList;
