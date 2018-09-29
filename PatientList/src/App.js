import React from "react";
import styled from "styled-components";

import { List } from "immutable";
import PouchDB from "pouchdb";

import PatientLists from "./components/PatientLists";
import PatientList from "./components/PatientList";

import {
  Form,
  FormPanel,
  Input,
  Panel,
  PanelTitle,
  ItemLabel
} from "./components/shared";

// Use as little code from MUI as i can, but i dont wanna waste time
// writing another dialog.
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import getMuiTheme from "material-ui/styles/getMuiTheme";
import {
  grey800,
  blueGrey500,
  pinkA100,
  white
} from "material-ui/styles/colors";

const muiTheme = getMuiTheme({
  palette: {
    textColor: grey800,
    alternateTextColor: white,
    primary1Color: pinkA100,
    accent1Color: blueGrey500
  }
});

const AppContainer = styled.div`
  height: 100vh;
  background-color: white;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  width: 100vw;
  height: 70px;
  background-color: #339966;
  color: white;
  align-items: center;
  font-size: 16px;
  padding: 0 10px;
`;

const ListsAndItems = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 70px);
  padding: 10px;
  overflow: scroll;
`;

const BackButton = styled.div`
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-right: 1px solid white;
  padding-right: 10px;
  margin-right: 10px;
`;

const NOLISTMSG =
  "You have no locations. This likely means the db is not connected.";
const NOITEMSMSG = "Click here to add a new patient";

/**
 * This is the main React application
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    // manage remoteDB here because user might change it via the UI
    // but don't put it in state because changing the backend db doesn't require a re-render
    this.remoteDB = props.remoteDB;

    this.state = {
      patientList: null,
      patientLists: [],
      totalPatientListItemCount: List(), //Immutable.js List with list ids as keys
      checkedTotalPatientListItemCount: List(), //Immutable.js List with list ids as keys
      patientListItems: null,
      adding: false,
      view: "lists",
      newName: "",
      settingsOpen: false,
      aboutOpen: false
    };
  }

  /**
   * Before this component shows the user anything, get the data from the local PouchDB
   *
   * Then, if we were initialized with a remote DB, synchronize with it
   */
  componentDidMount = () => {
    this.getPatientLists();
    if (this.remoteDB) {
      this.syncToRemote();
    }
  };

  /**
   * Synchronize local PouchDB with a remote CouchDB or Cloudant
   */
  syncToRemote = () => {
    this.props.localDB
      .sync(this.remoteDB)
      .on("change", change => {
        this.getPouchDocs();
      })
      // .on('paused', info => console.warn('replication paused.'))
      // .on('active', info => console.warn('replication resumed.'))
      .on("error", err =>
        console.warn("uh oh! an error occured while syncing.", err)
      );
  };

  /**
   * From the local DB, load all the patient lists and item counts and which are checked
   */
  getPatientLists = () => {
    let checkedCount = List();
    let totalCount = List();
    let lists = null;
    this.props.patientListRepository
      .find()
      .then(foundLists => {
        console.warn(
          "GOT PATIENT LISTS FROM POUCHDB. COUNT: " + foundLists.size
        );
        lists = foundLists;
        return foundLists;
      })
      .then(foundLists => {
        return this.props.patientListRepository.findItemsCountByList();
      })
      .then(countsList => {
        console.warn("TOTAL COUNT LIST");
        console.warn(countsList);
        totalCount = countsList;
        return this.props.patientListRepository.findItemsCountByList({
          selector: {
            type: "item",
            checked: true
          },
          fields: ["list"]
        });
      })
      .then(checkedList => {
        console.warn("CHECKED LIST");
        console.warn(checkedList);
        checkedCount = checkedList;
        this.setState({
          view: "lists",
          patientLists: lists,
          patientList: null,
          patientListItems: null,
          checkedTotalPatientListItemCount: checkedCount,
          totalPatientListItemCount: totalCount
        });
      });
  };

  /**
   * Get a patient list by id
   * @param {string} listid id of a patient list
   */
  openPatientList = listid => {
    this.props.patientListRepository
      .get(listid)
      .then(list => {
        return list;
      })
      .then(list => {
        this.getPatientListItems(listid).then(items => {
          this.setState({
            view: "items",
            patientList: list,
            patientListItems: items
          });
        });
      });
  };

  /**
   * Get the items in a patient list
   * @param {string} listid id of a patient list
   */
  getPatientListItems = listid => {
    return this.props.patientListRepository.findItems({
      selector: {
        type: "item",
        list: listid
      }
    });
  };

  /**
   * Refresh the items in a patient list
   * @param {string} listid id of a patient list
   */
  refreshPatientListItems = listid => {
    this.props.patientListRepository
      .findItems({
        selector: {
          type: "item",
          list: listid
        }
      })
      .then(items => {
        this.setState({
          view: "items",
          patientListItems: items
        });
      });
  };

  /**
   * Change the name of an item
   * @param {string} itemid id of an item
   * @param {string} newname new name of the item
   */
  editPatient = (itemid, newname, newsupply, newsupplyamount, newlocation) => {
    console.warn(
      "IN renamePatientListItem with id=" + itemid + ", name=" + newname
    );
    this.props.patientListRepository
      .getItem(itemid)
      .then(item => {
        item = item.set("name", newname);
        item = item.set("supplyName", newsupply);
        item = item.set("supplyAmount", newsupplyamount);
        item = item.set("location", newlocation);
        return this.props.patientListRepository.putItem(item);
      })
      .then(this.refreshPatientListItems(this.state.patientList._id));
  };

  /**
   * Change the status publicity of an item
   * @param {string} itemid id of an item
   */
  changeStatusPublicity = itemid => {
    console.warn("change publicity of patient status");
    this.props.patientListRepository
      .getItem(itemid)
      .then(item => {
        const currentPublicity = item.statusPublic;
        item = item.set("statusPublic", !currentPublicity);
        return this.props.patientListRepository.putItem(item);
      })
      .then(this.refreshPatientListItems(this.state.patientList._id));
  };

  /**
   * Change the location publicity of an item
   * @param {string} itemid id of an item
   */
  changeLocationPublicity = itemid => {
    console.warn("change publicity of patient location");
    this.props.patientListRepository
      .getItem(itemid)
      .then(item => {
        const currentPublicity = item.locationPublic;
        item = item.set("locationPublic", !currentPublicity);
        return this.props.patientListRepository.putItem(item);
      })
      .then(this.refreshPatientListItems(this.state.patientList._id));
  };

  /**
   * Change the patients health status
   * @param {string} itemid id of an item
   * @param {string} newstatus new status of the item
   */
  changePatientStatus = (itemid, newstatus) => {
    console.warn("change patient health status");
    this.props.patientListRepository
      .getItem(itemid)
      .then(item => {
        item = item.set("healthStatus", newstatus);
        return this.props.patientListRepository.putItem(item);
      })
      .then(this.refreshPatientListItems(this.state.patientList._id));
  };

  /**
   * Delete an item
   * @param {string} itemid id of an item
   */
  deletePatientListItem = itemid => {
    this.props.patientListRepository
      .getItem(itemid)
      .then(item => {
        return this.props.patientListRepository.deleteItem(item);
      })
      .then(this.refreshPatientListItems(this.state.patientList._id));
  };

  /**
   * Check off or un-check an item
   * @param {event} evt The click event on the UI element requesting to toggle state. It's id is the item id
   */
  toggleItemCheck = evt => {
    let itemid = evt.target.dataset.id;
    this.props.patientListRepository
      .getItem(itemid)
      .then(item => {
        item = item.set("checked", !item.checked);
        return this.props.patientListRepository.putItem(item);
      })
      .then(this.refreshPatientListItems(this.state.patientList._id));
  };

  /**
   * Check off all items in the patient list
   * @param {string} listid id of a patient list
   */
  checkAllListItems = listid => {
    let listcheck = true;
    this.getPatientListItems(listid)
      .then(items => {
        let newitems = [];
        items.forEach(item => {
          if (!item.checked) {
            newitems.push(item.mergeDeep({ checked: true }));
          }
        }, this);
        // if all items were already checked let's uncheck them all
        if (newitems.length === 0) {
          listcheck = false;
          items.forEach(item => {
            newitems.push(item.mergeDeep({ checked: false }));
          }, this);
        }
        let listOfPatientListItems = this.props.patientListFactory.newListOfPatientListItems(
          newitems
        );
        return this.props.patientListRepository.putItemsBulk(
          listOfPatientListItems
        );
      })
      .then(newitemsresponse => {
        return this.props.patientListRepository.get(listid);
      })
      .then(patientList => {
        patientList = patientList.set("checked", listcheck);
        return this.props.patientListRepository.put(patientList);
      })
      .then(patientList => {
        this.getPatientLists();
      });
  };

  /**
   * Delete a patient list
   * @param {string} listid id of a patient list
   */
  deletePatientList = listid => {
    this.props.patientListRepository
      .get(listid)
      .then(patientList => {
        patientList = patientList.set("_deleted", true);
        return this.props.patientListRepository.put(patientList);
      })
      .then(result => {
        this.getPatientLists();
      });
  };

  /**
   * Change the name of a patient list
   * @param {string} listid id of a patient list
   * @param {string} newname new name of the list
   */
  renamePatientList = (listid, newname) => {
    this.props.patientListRepository
      .get(listid)
      .then(patientList => {
        patientList = patientList.set("title", newname);
        return this.props.patientListRepository.put(patientList);
      })
      .then(this.getPatientLists);
  };

  /**
   * Create a new patient list or item based on where the event came from
   * @param {event} evt The click event on the UI element requesting to the action. Get the name from state and decide whether to add a list or an item based on the `state.view`
   */
  createNewPatientListOrItem = e => {
    e.preventDefault();
    this.setState({ adding: false });

    if (this.state.view === "lists") {
      let patientList = this.props.patientListFactory.newPatientList({
        title: this.state.newName
      });
      this.props.patientListRepository
        .put(patientList)
        .then(this.getPatientLists);
    } else if (this.state.view === "items") {
      let item = this.props.patientListFactory.newPatientListItem(
        {
          name: this.state.newName
        },
        this.state.patientList
      );
      this.props.patientListRepository.putItem(item).then(item => {
        this.getPatientListItems(this.state.patientList._id).then(items => {
          this.setState({
            view: "items",
            patientListItems: items
          });
        });
      });
    }
  };

  /**
   * Set the new name the user has typed in state for pickup later by other functions
   * @param {event} evt The change event on the UI element that let's user type a name
   */
  updateName = evt => {
    this.setState({ newName: evt.target.value });
  };

  /**
   * Tell the component we're in adding list or item mode
   */
  displayAddingUI = () => {
    this.setState({ adding: true });
  };

  /**
   * Show UI for typing in a new name
   */
  renderNewNameUI = () => {
    return (
      <Form onSubmit={this.createNewPatientListOrItem}>
        <FormPanel>
          <ItemLabel>
            Add Patient:
            <Input
              className="form-control"
              type="text"
              autoFocus={true}
              hintText="Name..."
              onChange={this.updateName}
              fullWidth={false}
              underlineStyle={{ width: "calc(100% - 24px)" }}
            />
          </ItemLabel>
        </FormPanel>
      </Form>
    );
  };

  /**
   * Show UI for patient lists
   */
  renderPatientLists = () => {
    if (this.state.patientLists.length < 1)
      return (
        <Panel>
          <PanelTitle title={NOLISTMSG}>{NOLISTMSG}</PanelTitle>
        </Panel>
      );
    return (
      <PatientLists
        patientLists={this.state.patientLists}
        openListFunc={this.openPatientList}
        deleteListFunc={this.deletePatientList}
        renameListFunc={this.renamePatientList}
        checkAllFunc={this.checkAllListItems}
        totalCounts={this.state.totalPatientListItemCount}
        checkedCounts={this.state.checkedTotalPatientListItemCount}
      />
    );
  };

  /**
   * Show UI for patient list items
   */
  renderPatientListItems = () => {
    return (
      <React.Fragment>
        <Panel onClick={this.displayAddingUI}>
          <PanelTitle title={NOITEMSMSG}>{NOITEMSMSG}</PanelTitle>
        </Panel>
        <PatientList
          patientListItems={this.state.patientListItems}
          deleteFunc={this.deletePatientListItem}
          changeStatusPublicity={this.changeStatusPublicity}
          changeLocationPublicity={this.changeLocationPublicity}
          changePatientStatus={this.changePatientStatus}
          toggleItemCheckFunc={this.toggleItemCheck}
          editPatientFunc={this.editPatient}
        />
      </React.Fragment>
    );
  };

  /**
   * If we're showing items from a patient list, show a back button.
   * If we're showing patient lists, show a settings button.
   */
  renderBackButton = () => {
    if (this.state.view === "items")
      return (
        <BackButton touch={true} onClick={this.getPatientLists}>
          {"<- Back to Aid Stations"}
        </BackButton>
      );
    else return <div>{""}</div>;
  };

  /**
   * Tell component we want to show settings dialog
   */
  handleOpenSettings = () => {
    this.setState({ settingsOpen: true });
  };

  /**
   * Tell component we want to hide settings dialog
   */
  handleCloseSettings = () => {
    this.setState({ settingsOpen: false });
  };

  /**
   * Tell component we want to show about dialog
   */
  handleOpenAbout = () => {
    this.setState({ aboutOpen: true });
  };

  /**
   * Tell component we want to hide about dialog
   */
  handleCloseAbout = () => {
    this.setState({ aboutOpen: false });
  };

  /**
   * Right now the only setting is changing the remote DB, so do that then close the dialog
   */
  handleSubmitSettings = () => {
    try {
      this.remoteDB = new PouchDB(this.tempdburl);
      this.syncToRemote();
    } catch (ex) {
      console.warn("Error setting remote database: ");
      console.warn(ex);
    }
    this.handleCloseSettings();
  };

  render() {
    let screenname = "Aid Stations";
    if (this.state.view === "items")
      screenname = "Patients at: " + this.state.patientList.title;
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <AppContainer>
          <Header title={screenname}>
            {this.renderBackButton()}
            {screenname}
          </Header>
          <ListsAndItems>
            {this.state.adding && this.renderNewNameUI()}
            {this.state.view === "lists"
              ? this.renderPatientLists()
              : this.renderPatientListItems()}
          </ListsAndItems>
        </AppContainer>
      </MuiThemeProvider>
    );
  }
}
export default App;
