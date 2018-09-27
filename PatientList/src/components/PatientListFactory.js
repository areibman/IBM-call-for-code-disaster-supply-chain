const cuid = require("cuid");

const { Record, List } = require("immutable");

class PatientListFactory {
  constructor() {
    this._PatientList = Record({
      _id: undefined,
      _rev: undefined,
      _deleted: false,
      type: "list",
      version: 1,
      title: undefined,
      checked: false,
      place: undefined,
      createdAt: undefined,
      updatedAt: undefined
    });
    this._PatientListItem = Record({
      _id: undefined,
      _rev: undefined,
      _deleted: false,
      name: undefined,
      age: undefined,
      location: undefined,
      statusPublic: false,
      locationPublic: false,
      healthStatus: "",
      type: "item",
      version: 1,
      list: undefined,
      checked: false,
      createdAt: undefined,
      updatedAt: undefined
    });
  }

  _guardPatientList(patientList) {
    if (!Record.isRecord(patientList)) {
      throw new Error("Patient List must be a Record");
    }
    if (patientList.type !== "list") {
      throw new Error("Patient List type must be list");
    }
  }

  _guardListOfPatientLists(listOfPatientLists) {
    listOfPatientLists.forEach(patientList =>
      this._guardPatientList(patientList)
    );
  }

  _guardPatientListItem(patientListItem) {
    if (!Record.isRecord(patientListItem)) {
      throw new Error("Patient List Item must be a Record");
    }
    if (patientListItem.type !== "item") {
      throw new Error("Patient List Item type must be item");
    }
  }

  _guardListOfPatientListItems(listOfPatientListItems) {
    listOfPatientListItems.forEach(patientListItem =>
      this._guardPatientListItem(patientListItem)
    );
  }

  newPatientList(values) {
    let patientList = new this._PatientList(values);
    if (patientList._id === undefined) {
      patientList = patientList.set("_id", "list:" + cuid());
    }
    return patientList;
  }

  newListOfPatientLists(patientLists) {
    let listOfPatientLists = new List(patientLists);
    this._guardListOfPatientLists(listOfPatientLists);
    return listOfPatientLists;
  }

  newPatientListItem(values, patientList) {
    let patientListItem = new this._PatientListItem(values);
    if (patientListItem._id === undefined) {
      patientListItem = patientListItem.set("_id", "item:" + cuid());
    }
    if (patientListItem.list === undefined && patientList) {
      patientListItem = patientListItem.set("list", patientList._id);
    }
    return patientListItem;
  }

  newListOfPatientListItems(patientListItems) {
    let listOfPatientListItems = new List(patientListItems);
    this._guardListOfPatientListItems(listOfPatientListItems);
    return listOfPatientListItems;
  }
}

exports.PatientListFactory = PatientListFactory;
