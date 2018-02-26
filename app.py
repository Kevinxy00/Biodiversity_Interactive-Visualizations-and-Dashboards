# *** Exported from Sqlite Data Explore.ipynb *** 
#     For a more detailed look at what the data looks like, see the above file. 
# coding: utf-8

# In[1]:


from flask import Flask, jsonify, render_template
from sqlalchemy import create_engine, inspect, MetaData
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base


# In[2]:


app = Flask(__name__)


# In[3]:


# *** Use SQLAlchemy `create_engine` to connect to your sqlite database. ***
engine = create_engine("sqlite:///DataSets/belly_button_biodiversity.sqlite")
#    automapping the columns to sqlalchemy base object
Base = automap_base()
# reflect the tables
Base.prepare(engine, reflect=True)


# In[7]:

# save list of column names to var
inspector = inspect(engine)
columns_otu = inspector.get_columns("otu")
columns_samples = inspector.get_columns("samples")
columns_samples_meta = inspector.get_columns("samples_metadata")

# saving references to each table
otu_class = Base.classes.otu
samples_class = Base.classes.samples
meta_class = Base.classes.samples_metadata


# In[8]:

# creating session
session = Session(engine)


###
# Flask Routes
###


# In[9]:


# *** create route that renders index.html template ***
@app.route("/")
def home():
    return render_template("index.html")


# In[10]:


# *** route for list of sample names ***
@app.route("/names")
def list_names():
    names_ls = []
    for row in columns_samples:
        # getting rid of the first column "otu_id"
        if row["name"] != "otu_id":
            names_ls.append(row["name"])
    # returns list of sample names e.g. BB_943
    return jsonify(names_ls)


# In[11]:


# *** route for list of OTU descriptions ***
@app.route("/otu")
def list_otu():
    otu_ls = []
    for item in session.query(otu_class.lowest_taxonomic_unit_found).all():
        otu_ls.append(item)
    # returns list of OTU descriptions ("lowest taxonomic unit found")
    return jsonify(otu_ls)


# In[12]:


# *** route for list of metaData for a given sample. ***
@app.route('/metadata/<sample>') # takes in a sample name arg. e.g. BB_940 
def list_meta_sample(sample):
    # First, transform input: get rid of "BB_" as only the number portions are in the metadata table.  
    sample = sample.replace('BB_','')
    
    # Query all from metadata table where sample id matches. 
    # note: ID is unique, so only grab first result
    meta_result = session.query(meta_class).filter(meta_class.SAMPLEID == sample).first()
    # Append to a dictionary
    sample_dict = {}
    sample_dict = {"AGE":meta_result.AGE, "BBTYPE":meta_result.BBTYPE,\
                        "ETHNICITY":meta_result.ETHNICITY, "GENDER":meta_result.GENDER,\
                       "LOCATION":meta_result.LOCATION, "SAMPLEID":meta_result.SAMPLEID}    
    # Returns age, belly button type (In or Out), ethnicity, gender, location, & sample id
    return jsonify(sample_dict)


# In[13]:


# *** route for Weekly Washing Frequency as a number ***
@app.route('/wfreq/<sample>')
def return_wash_freq(sample):
    # First, transform input: get rid of "BB_" as only the number portions are in the metadata table.  
    sample = sample.replace('BB_','')
    # Query washing frequency from metadata table where sample id matches. 
    # note: ID is unique, so only grab first result
    wfreq_result = session.query(meta_class.WFREQ).filter(meta_class.SAMPLEID == sample).first()
    # Returns integer of washing frequency. 
    wfreq = wfreq_result[0] # note: wfreq_result is a list w/ one item. 
    return jsonify(wfreq)


# In[14]:


# *** route for OTU id's and sample values for a given sample ***
@app.route('/samples/<sample>')
def otuID_and_sampleValues(sample):
    try: 
        # query all otu_id and inputted sample value, sorted.
        otuID_query = session.query(samples_class.otu_id, getattr(samples_class, sample))\
                .order_by(getattr(samples_class, sample).desc()).all()
        # result is a list of pairs, format==(otu_id, sample_value)
        #
        sorted_ls = [{}]
        otuID_ls = []
        sampVal_ls = []
        # append each element in the pair to the appropriate list 
        for pair in otuID_query:
            otuID_ls.append(pair[0])
            sampVal_ls.append(pair[1])
        #
        # append list to appropriate dictionary in the sorted list
        sorted_ls[0]['otu_ids'] = otuID_ls
        sorted_ls[0]["sample_values"] = sampVal_ls
        #
        # return jsonified sorted list to the api route
        return jsonify(sorted_ls)
        
    except AttributeError:
        ''' try/except to catch where sample == (nonsense or bad format). 
        getattr will return attribute error if inputted sample not found. ''' 
        error_msg = {"There was an attribute error":"Check the inputted sample to see if format is correct"}
        return jsonify(error_msg)
        

# In[16]:


# *** run app ***
if __name__ == "__main__":
    app.run(debug=False)
    

