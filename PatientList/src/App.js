import React from "react";
import { List } from "immutable";
import styled, { injectGlobal } from "styled-components";
// We're using Material Design React components from http://www.material-ui.com
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import getMuiTheme from "material-ui/styles/getMuiTheme";
import AppBar from "material-ui/AppBar";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import FloatingActionButton from "material-ui/FloatingActionButton";
import ContentAdd from "material-ui/svg-icons/content/add";
import TextField from "material-ui/TextField";
import Paper from "material-ui/Paper";
import { Card, CardTitle } from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import KeyboardBackspace from "material-ui/svg-icons/hardware/keyboard-backspace";
import SettingsIcon from "material-ui/svg-icons/action/settings";
import AboutIcon from "material-ui/svg-icons/action/info-outline";
import {
  grey800,
  blueGrey500,
  pinkA100,
  white
} from "material-ui/styles/colors";

import PouchDB from "pouchdb";

import PatientLists from "./components/PatientLists";
import PatientList from "./components/PatientList";

injectGlobal`
.App{
  height: calc(100vh - 70px);
  background-color: #92c1e9;
}
`;

const Header = styled.div`
  display: flex;
  width: 100vw;
  height: 70px;
  background-color: rebeccapurple;
  color: white;
  align-items: center;
  font-size: 16px;
  padding: 0 10px;
`;

// create a custom color scheme for Material-UI
const muiTheme = getMuiTheme({
  palette: {
    textColor: grey800,
    alternateTextColor: white,
    primary1Color: pinkA100,
    accent1Color: blueGrey500
  }
});

const appBarStyle = {
  backgroundColor: blueGrey500,
  width: "100%"
};

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
      .sync(this.remoteDB, { live: true, retry: true })
      .on("change", change => {
        this.getPouchDocs();
      })
      // .on('paused', info => console.log('replication paused.'))
      // .on('active', info => console.log('replication resumed.'))
      .on("error", err =>
        console.log("uh oh! an error occured while synching.")
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
        console.log(
          "GOT SHOPPING LISTS FROM POUCHDB. COUNT: " + foundLists.size
        );
        lists = foundLists;
        return foundLists;
      })
      .then(foundLists => {
        return this.props.patientListRepository.findItemsCountByList();
      })
      .then(countsList => {
        console.log("TOTAL COUNT LIST");
        console.log(countsList);
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
        console.log("CHECKED LIST");
        console.log(checkedList);
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
  renamePatientListItem = (itemid, newname) => {
    console.log(
      "IN renamePatientListItem with id=" + itemid + ", name=" + newname
    );
    this.props.patientListRepository
      .getItem(itemid)
      .then(item => {
        item = item.set("name", newname);
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
    console.log("dididididi");
    this.setState({ adding: true });
  };

  /**
   * Show UI for typing in a new name
   */
  renderNewNameUI = () => {
    return (
      <form
        onSubmit={this.createNewPatientListOrItem}
        style={{ marginTop: "12px" }}
      >
        <Paper>
          <TextField
            className="form-control"
            type="text"
            autoFocus={true}
            hintText="Name..."
            onChange={this.updateName}
            fullWidth={false}
            style={{ padding: "0px 12px", width: "calc(100% - 24px)" }}
            underlineStyle={{ width: "calc(100% - 24px)" }}
          />
        </Paper>
      </form>
    );
  };

  /**
   * Show UI for patient lists
   */
  renderPatientLists = () => {
    if (this.state.patientLists.length < 1)
      return (
        <Card style={{ margin: "12px 0" }}>
          <CardTitle title={NOLISTMSG} />
        </Card>
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
        <Card onClick={this.displayAddingUI} style={{ margin: "12px 0" }}>
          <CardTitle title={NOITEMSMSG} />
        </Card>
        <PatientList
          patientListItems={this.state.patientListItems}
          deleteFunc={this.deletePatientListItem}
          toggleItemCheckFunc={this.toggleItemCheck}
          renameItemFunc={this.renamePatientListItem}
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
        <IconButton touch={true} onClick={this.getPatientLists}>
          <KeyboardBackspace />
        </IconButton>
      );
    else return <div>{""}</div>;
  };

  renderActionButtons = () => {
    const iconStyle = {
      fill: "white"
    };
    return (
      <div>
        <IconButton
          touch={true}
          onClick={this.handleOpenSettings}
          iconStyle={iconStyle}
        >
          <SettingsIcon />
        </IconButton>
        <IconButton
          touch={true}
          onClick={this.handleOpenAbout}
          iconStyle={iconStyle}
        >
          <AboutIcon />
        </IconButton>
      </div>
    );
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
      console.log("Error setting remote database: ");
      console.log(ex);
    }
    this.handleCloseSettings();
  };

  /**
   * Show settings dialog UI
   */
  showSettingsDialog = () => {
    const actions = [
      <FlatButton
        label="Cancel"
        primary={false}
        keyboardFocused={true}
        onClick={this.handleCloseSettings}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        onClick={this.handleSubmitSettings}
      />
    ];

    return (
      <Dialog
        title="Patient List Settings"
        actions={actions}
        modal={false}
        open={this.state.settingsOpen}
        onRequestClose={this.handleCloseSettings}
      >
        <p>
          Enter a fully qualified URL (including username and password) to a
          remote IBM Cloudant, Apache CouchDB, or PouchDB database to sync your
          patient list.
        </p>
        <TextField
          id="db-url"
          floatingLabelText="https://username:password@localhost:5984/database"
          fullWidth={true}
          onChange={e => {
            this.tempdburl = e.target.value;
          }}
        />
      </Dialog>
    );
  };

  /**
   * Show about dialog UI
   */
  showAboutDialog = () => {
    const actions = [
      <FlatButton
        label="Close"
        primary={false}
        keyboardFocused={true}
        onClick={this.handleCloseAbout}
      />
    ];

    return (
      <Dialog
        title="About"
        actions={actions}
        modal={false}
        open={this.state.aboutOpen}
        onRequestClose={this.handleAboutSettings}
      >
        <p>
          <a
            href="https://github.com/ibm-watson-data-lab/patient-list"
            target="_blank"
            rel="noopener noreferrer"
          >
            Patient List is a series of Offline First demo apps, each built
            using a different stack.
          </a>
          These demo apps cover Progressive Web Apps, hybrid mobile apps, native
          mobile apps, and desktop apps. This particular demo app is a
          <strong>Progressive Web App</strong>
          built using <strong>React and PouchDB</strong>.
          <a
            href="https://github.com/ibm-watson-data-lab/patient-list-react-pouchdb"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get the source code
          </a>.
        </p>
      </Dialog>
    );
  };

  /**
   * Show the UI
   */
  render() {
    let screenname = "Aid Stations";
    if (this.state.view === "items") screenname = this.state.patientList.title;
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div className="App">
          <Header title={screenname}>
            {this.renderBackButton()}
            {screenname}
          </Header>
          <div className={"listsanditems"} style={{ margin: "8px" }}>
            {this.state.adding ? this.renderNewNameUI() : <span />}
            {this.state.view === "lists"
              ? this.renderPatientLists()
              : this.renderPatientListItems()}
          </div>
          {this.state.settingsOpen ? this.showSettingsDialog() : <span />}
          {this.state.aboutOpen ? this.showAboutDialog() : <span />}
        </div>
      </MuiThemeProvider>
    );
  }
}
/*
<FloatingActionButton
  onClick={this.displayAddingUI}
  mini={true}
  style={{ position: "fixed", bottom: "25px", right: "25px" }}
>
  <ContentAdd />
</FloatingActionButton>
*/
export default App;
