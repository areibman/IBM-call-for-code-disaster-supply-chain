const { PatientListRepository } = require("./PatientListRepository");
const { PatientListFactory } = require("./PatientListFactory");
const { Record } = require("immutable");

class PatientListRepositoryPouchDB extends PatientListRepository {
  constructor(db) {
    super();
    this.db = db;
    this._patientListFactory = new PatientListFactory();
  }

  _guardPatientList(patientList) {
    if (!Record.isRecord(patientList)) {
      throw new Error("Patient List must be a Record");
    }
    if (patientList._id === undefined) {
      throw new Error("Patient List _id must be set");
    }
    if (patientList.type !== "list") {
      throw new Error("Patient List type must be list");
    }
  }

  _guardPatientListItem(patientListItem) {
    if (!Record.isRecord(patientListItem)) {
      throw new Error("Patient List Item must be a Record");
    }
    if (patientListItem._id === undefined) {
      throw new Error("Patient List Item _id must be set");
    }
    if (patientListItem.type !== "item") {
      throw new Error("Patient List Item type must be item");
    }
  }

  _guardRequest(request) {
    if (!request) {
      throw new Error("Request must be defined");
    }
    if (!request.selector) {
      throw new Error("Request must have a selector property");
    }
    if (!request.selector.type) {
      throw new Error("Request selector must have a type property");
    }
  }

  _guardPatientListRequest(request) {
    this._guardRequest(request);
    if (request.selector.type !== "list") {
      throw new Error(
        "Request selector must have a type property with a value of 'list'"
      );
    }
  }

  _guardPatientListItemRequest(request) {
    this._guardRequest(request);
    if (request.selector.type !== "item") {
      throw new Error(
        "Request selector must have a type property with a value of 'item'"
      );
    }
  }

  _put(record) {
    const updatedAt = new Date().toISOString();
    if (!record._rev) {
      record = record.mergeDeep({
        createdAt: updatedAt
      });
    }
    record = record.mergeDeep({
      updatedAt: updatedAt
    });
    return this.db.put(record.toJSON()).then(result => {
      return record.mergeDeep({
        _id: result.id,
        _rev: result.rev
      });
    });
  }

  _get(id) {
    return this.db.get(id);
  }

  _delete(record) {
    const updatedAt = new Date().toISOString();
    record = record.mergeDeep({
      _deleted: true,
      updatedAt: updatedAt
    });
    return this.db.put(record.toJSON()).then(result => {
      return record.mergeDeep({
        _rev: result.rev
      });
    });
  }

  _ensureIndexOfType() {
    return this.db.createIndex({
      index: {
        fields: ["type"]
      }
    });
  }

  _ensureIndexOfTypeAndList() {
    return this.db.createIndex({
      index: {
        fields: ["type", "list"]
      }
    });
  }

  _ensureIndexOfTypeAndChecked() {
    return this.db.createIndex({
      index: {
        fields: ["type", "checked"]
      }
    });
  }

  _ensureIndexOfTypeAndListAndChecked() {
    return this.db.createIndex({
      index: {
        fields: ["type", "list", "checked"]
      }
    });
  }

  ensureIndexes() {
    return Promise.all([
      this._ensureIndexOfType(),
      this._ensureIndexOfTypeAndList(),
      this._ensureIndexOfTypeAndChecked(),
      this._ensureIndexOfTypeAndListAndChecked()
    ]);
  }

  put(patientList) {
    this._guardPatientList(patientList);
    return this._put(patientList);
  }

  putBulk(patientLists) {
    let putLists = [];
    patientLists.forEach(patientList => {
      putLists.push(this.put(patientList));
    });
    return Promise.all(putLists).then(patientLists => {
      return this._patientListFactory.newListOfPatientLists(patientLists);
    });
  }

  get(patientListId) {
    return this._get(patientListId).then(doc => {
      const patientList = this._patientListFactory.newPatientList(doc);
      this._guardPatientList(patientList);
      return patientList;
    });
  }

  find(request = { selector: { type: "list" } }) {
    this._guardPatientListRequest(request);
    return this.db.find(request).then(result => {
      if (result.warning) {
        console.warn(result.warning);
      }
      let listOfPatientLists = this._patientListFactory.newListOfPatientLists();
      result.docs.forEach(doc => {
        listOfPatientLists = listOfPatientLists.push(
          this._patientListFactory.newPatientList(doc)
        );
      });
      return listOfPatientLists;
    });
  }

  delete(patientList) {
    this._guardPatientList(patientList);
    return this._delete(patientList).then(patientList => {
      return this.deleteItemsBulkByFind({
        selector: {
          type: "item",
          list: patientList._id
        }
      }).then(listOfPatientListItems => {
        return patientList;
      });
    });
  }

  putItem(patientListItem) {
    this._guardPatientListItem(patientListItem);
    return this._put(patientListItem);
  }

  putItemsBulk(patientListItems) {
    let putItems = [];
    patientListItems.forEach(patientListItem => {
      putItems.push(this.putItem(patientListItem));
    });
    return Promise.all(putItems).then(patientListItems => {
      return this._patientListFactory.newListOfPatientListItems(
        patientListItems
      );
    });
  }

  getItem(patientListItemId) {
    return this._get(patientListItemId).then(doc => {
      const patientListItem = this._patientListFactory.newPatientListItem(doc);
      this._guardPatientListItem(patientListItem);
      return patientListItem;
    });
  }

  findItems(request = { selector: { type: "item" } }) {
    this._guardPatientListItemRequest(request);
    return this.db.find(request).then(result => {
      if (result.warning) {
        console.warn(result.warning);
      }
      let listOfPatientListItems = this._patientListFactory.newListOfPatientListItems();
      result.docs.forEach(doc => {
        listOfPatientListItems = listOfPatientListItems.push(
          this._patientListFactory.newPatientListItem(doc)
        );
      });
      return listOfPatientListItems;
    });
  }

  findItemsCountByList(
    request = { selector: { type: "item" }, fields: ["list"] }
  ) {
    if (request.fields && !request.fields.includes("list")) {
      throw new Error(
        "Request must have a fields property that includes a value of 'list'"
      );
    }
    return this.findItems(request).then(listOfPatientListItems => {
      return listOfPatientListItems.countBy(patientListItem => {
        return patientListItem.list;
      });
    });
  }

  deleteItem(patientListItem) {
    this._guardPatientListItem(patientListItem);
    return this._delete(patientListItem);
  }

  deleteItemsBulk(patientListItems) {
    let deletedItems = [];
    patientListItems.forEach(patientListItem => {
      deletedItems.push(this.deleteItem(patientListItem));
    });
    return Promise.all(deletedItems).then(patientListItems => {
      return this._patientListFactory.newListOfPatientListItems(
        patientListItems
      );
    });
  }

  deleteItemsBulkByFind(request = { selector: { type: "item" } }) {
    if (request.fields) {
      throw new Error("Request must not have a fields property");
    }
    return this.findItems(request).then(listOfPatientListItems => {
      return this.deleteItemsBulk(listOfPatientListItems);
    });
  }
}

exports.PatientListRepositoryPouchDB = PatientListRepositoryPouchDB;
