import React from "react";
import styled from "styled-components";

import "./PatientList.css";
import Dialog from "material-ui/Dialog";

import { ItemContainer, ItemLabel, ItemButton, Input } from "./shared";

class PatientList extends React.Component {
  /* all state actions are for handling the renaming dialog */
  state = {
    open: false,
    activeItemId: "",
    oldName: "",
    newName: "",
    search: ""
  };

  handleOpen = (itemid, itemtitle) => {
    this.setState({ open: true, activeItemId: itemid, oldName: itemtitle });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleSubmit = e => {
    this.props.renameItemFunc(this.state.activeItemId, this.state.newName);
    this.handleClose();
  };

  updateName = e => {
    this.setState({ newName: e.target.value });
  };

  searchChange = e => {
    this.setState({ search: e.target.value });
  };
  /**
   * Show the UI. The most important thing happening here is that the UI elements
   * make use of the functions passed into the component as props to do all the heavy
   * lifting of manipulating patient list items, so this component is pure UI.
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
    /* end rename dialog stuff */

    // let items = this.props.patientListItems.map(item => (
    //   <div key={"listitem_" + item._id}>
    //     <ListItem
    //       className="patientlistitem"
    //       primaryText={
    //         <span className={item.checked ? "checkeditem" : "uncheckeditem"}>
    //           {item.title}
    //         </span>
    //       }
    //       leftCheckbox={
    //         <Checkbox
    //           onCheck={this.props.toggleItemCheckFunc}
    //           data-item={item._id}
    //           data-id={item._id}
    //           checked={item.checked}
    //         />
    //       }
    //       rightIconButton={
    //         <IconMenu
    //           iconButtonElement={moveVertButton}
    //           className="vertmenu-list"
    //         >
    //           <MenuItem
    //             primaryText="Rename"
    //             onClick={() => this.handleOpen(item._id, item.title)}
    //           />
    //           <MenuItem
    //             primaryText="Delete"
    //             onClick={() => this.props.deleteFunc(item._id)}
    //           />
    //         </IconMenu>
    //       }
    //     />
    //     <Divider inset={true} />
    //   </div>
    // ));

    const items = this.props.patientListItems.map(item => {
      if (this.state.search) {
        if (!item.name.includes(this.state.search)) {
          return null;
        }
      }
      return (
        <ItemContainer key={item._id}>
          <ItemLabel>Patient Name: {item.name}</ItemLabel>
          <ItemLabel>Location: Uganda ~-DeWay-~</ItemLabel>
          <ItemLabel>Status: Yellow</ItemLabel>
          <ItemLabel>
            <input type="checkbox" />Status Public
          </ItemLabel>
          <ItemLabel>
            <input type="checkbox" />Location Public
          </ItemLabel>
          <ItemButton onClick={() => this.props.deleteFunc(item._id)}>
            Remove Patient
          </ItemButton>
          <ItemButton onClick={() => this.handleOpen(item._id, item.name)}>
            Edit Patient Name
          </ItemButton>
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
          title="Rename Item"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
        >
          {/* <form onSubmit={this.handleSubmit}> */}
          <Input
            className="form-control"
            type="text"
            id="textfield-item-rename"
            defaultValue={this.state.oldName}
            onChange={this.updateName}
            fullWidth={true}
          />
          {/* </form> */}
        </Dialog>
      </div>
    );
  }
}

export default PatientList;
