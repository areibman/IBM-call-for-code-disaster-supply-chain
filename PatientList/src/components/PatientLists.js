import React from "react";

import "./PatientLists.css";
import Dialog from "material-ui/Dialog";

import {
  ItemContainer,
  ItemLabel,
  ItemButton,
  Input,
  LabeledInfo
} from "./shared";

class PatientLists extends React.PureComponent {
  // all state actions are for handling the renaming dialog
  state = {
    open: false,
    activeListId: "",
    oldName: "",
    newName: "",
    search: ""
  };

  handleOpen = (listid, listtitle) => {
    this.setState({ open: true, activeListId: listid, oldName: listtitle });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleSubmit = e => {
    this.props.renameListFunc(this.state.activeListId, this.state.newName);
    this.handleClose();
  };

  updateName = e => {
    this.setState({ newName: e.target.value });
  };

  searchChange = e => {
    this.setState({ search: e.target.value });
  };

  openList = listid => {
    this.props.openListFunc(listid, this.props.refreshPatientListItems());
  };
  /**
   * Show the UI. The most important thing happening here is that the UI elements
   * make use of the functions passed into the component as props to do all the heavy
   * lifting of manipulating patient lists, so this component is pure UI.
   */
  render() {
    /* rename dialog stuff */
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
    let used = [];
    const listItems = this.props.patientLists.map(list => {
      if (used.includes(list["Location name"])) {
        return null;
      }
      if (this.state.search) {
        if (!list["Location name"].includes(this.state.search)) {
          return null;
        }
      }
      used.push(list["Location name"]);

      return (
        <ItemContainer key={list._id}>
          <ItemLabel>
            Aid Station Name: <LabeledInfo>{list["Location name"]}</LabeledInfo>
          </ItemLabel>
          <ItemButton onClick={() => this.openList(list._id)}>
            Open Patient List
          </ItemButton>
        </ItemContainer>
      );
    });

    return (
      <div>
        Search Aid Stations:{" "}
        <Input value={this.state.search} onChange={this.searchChange} />
        {listItems}
        <Dialog
          title="Rename Item"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
        >
          <Input
            className="form-control"
            type="text"
            id="textfield-item-rename"
            defaultValue={this.state.oldName}
            onChange={this.updateName}
            fullWidth={true}
          />
        </Dialog>
      </div>
    );
  }
}

export default PatientLists;
