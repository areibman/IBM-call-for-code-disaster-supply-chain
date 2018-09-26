import React from "react";

import "./PatientLists.css";
import Dialog from "material-ui/Dialog";

import { ItemContainer, ItemLabel, ItemButton, Input } from "./shared";

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
    /* end rename dialog stuff */

    //   let listItems = this.props.patientLists.map( (list) =>
    //   <Card key={list._id} style={{margin:"12px 0"}}>
    //     <CardTitle
    //       title={list.title}
    //       children={
    //         <IconMenu iconButtonElement={iconButtonElement}
    //           className="vertmenu-list">
    //           <MenuItem
    //             primaryText="Open"
    //             onClick={()=>this.props.openListFunc(list._id)}/>
    //           <MenuItem
    //             primaryText="Rename"
    //             onClick={()=>this.handleOpen(list._id, list.title)}/>
    //           <MenuItem
    //             primaryText="Delete"
    //             onClick={()=>this.props.deleteListFunc(list._id)}/>
    //         </IconMenu>
    //       } />
    //     <CardActions>
    //       <Checkbox label={(this.props.checkedCounts.get(list._id) || 0)+' of '+(this.props.totalCounts.get(list._id) || 0)+' items checked'}
    //         checked={list.checked}
    //         onCheck={()=>this.props.checkAllFunc(list._id)} />
    //     </CardActions>
    //   </Card>
    // )

    const listItems = this.props.patientLists.map(list => {
      if (this.state.search) {
        if (!list.title.includes(this.state.search)) {
          return null;
        }
      }
      return (
        <ItemContainer key={list._id}>
          <ItemLabel>{list.title}</ItemLabel>
          <ItemLabel>Clinic Name </ItemLabel>
          <ItemLabel>Number of Patients 33</ItemLabel>
          <ItemLabel>Supply Status - Green</ItemLabel>
          <ItemButton onClick={() => this.props.openListFunc(list._id)}>
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
