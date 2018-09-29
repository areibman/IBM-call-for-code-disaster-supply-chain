
# coding: utf-8

# In[1]:

import warnings
warnings.filterwarnings("ignore")
import pandas as pd
import pixiedust
import numpy as np
import random
import requests
import json


# In[2]:


df = pd.read_csv('DB_ready.csv')


# In[3]:


config = dict(
    username="2660e8fa-aac2-45ef-81ba-217967728ad2-bluemix",
    password="9cd1b00e6b6927e663bfa0e2e9d677e163378a7c98e09bfb598dd74a4439fc7a",
    database="cfc_patient_db")
params = {'include_docs': 'true'}


# In[4]:


url = "https://{username}:{password}@{username}.cloudant.com/{database}/_all_docs".format(
    **config)


# In[5]:


auth_headers = {"Content-Type": "application/x-www-form-urlencoded"}
r = requests.get(url=url, params=params)
data = json.loads(r.text)


# In[6]:


# print(json.dumps(data, indent=2))


# In[7]:


df = [row["doc"] for row in data["rows"]]


# In[8]:


df = pd.DataFrame(df)


# In[9]:


df[["lat", "lon", "amount"]] = df[[
    "lat", "lon", "amount"]].apply(pd.to_numeric)


# In[10]:


#df[["amount"]] = df[["amount"]].astype(int)


# In[11]:


# display(df)


# In[12]:


people = pd.DataFrame(
    columns=['name', 'needed_item', 'amount', 'location', 'unit'])


# In[13]:


with open('people.txt', 'r') as f:
    names = f.readlines()


# In[14]:


names = [n.strip('\n') for n in names]
people['name'] = names


# In[15]:


items_list = set([(doc["Items"].lower(), doc["Unit"])
                  for doc in [row["doc"] for row in data["rows"]] if "Items" in doc])
locations = [(doc["Location name"], doc["lat"], doc["lon"])
             for doc in [row["doc"] for row in data["rows"]] if "Items" in doc]


# In[16]:


location_dict = {' '.join(
    location[:-2]): (location[-2], location[-1]) for location in locations}


# In[17]:


unit_lookup = {name: unit for name, unit in items_list}


# In[18]:


people['needed_item'] = [random.choice(list(items_list))[
    0] for i in range(len(people))]


# In[19]:


people['unit'] = [unit_lookup[item] for item in people['needed_item']]


# In[20]:


items_list


# In[21]:


locations = pd.DataFrame([(doc["Location name"], (doc["lat"], doc["lon"])) for doc in [
                         row["doc"] for row in data["rows"]] if "Items" in doc], columns=['name', 'latlon'])


# In[22]:


people['amount'] = np.random.randint(5, size=len(people))+1


# In[23]:


people['location'] = [random.choice(
    list(locations['name'])) for i in range(len(people))]


# In[24]:


station_supplies = pd.DataFrame(
    columns=['name', 'item_name', 'item_quanity', 'lat', 'lon'])


# In[25]:


station_supplies = {}

for person in people.iterrows():
    person = person[1]
    if (person['needed_item'], person['location']) in station_supplies.keys():
        station_supplies[(person['needed_item'],
                          person['location'])] += person['amount']
    else:
        station_supplies[(person['needed_item'],
                          person['location'])] = person['amount']


# In[26]:


station_supplies


# In[27]:


new_df = []
for location_df in list(df.groupby('Location name')):
    temp_df = location_df[1][['amount', 'Items']]
    temp_df['Location name'] = location_df[0]
    temp_df.rename(columns={'amount': 'current amount'}, inplace=True)
    new_df.append(temp_df)


# In[28]:


current_amounts = pd.concat(new_df)
current_amounts = current_amounts.dropna(subset=['Items'], how='all')
current_amounts


# In[29]:


current_amounts_lookup = {}
for value in current_amounts.values:
    if value[2] in current_amounts_lookup:
        current_amounts_lookup[value[2]][value[1]] = value[0]
    else:
        current_amounts_lookup[value[2]] = {value[1]: value[0]}


# In[30]:


matrix = []

for key in station_supplies.keys():
    item = key[0]
    location = key[1]
    amount = station_supplies[key]
    if location in current_amounts_lookup:
        if item in current_amounts_lookup[location]:
            requested = (amount - current_amounts_lookup[location][item])
            # print(requested,location,item)
        else:
            requested = amount
    else:
        requested = amount

    matrix.append(pd.Series([item, location, amount, requested, unit_lookup[item], *location_dict[location]],
                            index=['needed_item', 'Location', 'amount needed', 'requested', 'unit', 'lat', 'long']))


# In[31]:


final_data = pd.DataFrame(matrix)


# In[32]:


final_data['amount requested'] = [
    int(np.random.normal(x,)) for x in final_data['amount needed']]


# In[33]:


# display(final_data)


# In[34]:


pd.merge(current_amounts, final_data,  how='left', left_on=[
         'Location name', 'Items'], right_on=['Location', 'needed_item'])


# In[35]:


# display(final_data)


# In[36]:


final_data.to_pickle('final_data.p')


# In[37]:


FetchDB = final_data
