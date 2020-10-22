from flask import Flask, render_template, request, redirect, Response, jsonify
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.preprocessing import MinMaxScaler
from keras.utils import to_categorical
from sklearn.cluster import KMeans
from kneed.knee_locator import KneeLocator
from sklearn import decomposition
from sklearn.manifold import MDS
from sklearn.metrics import pairwise_distances
import math
import json

app = Flask(__name__)
df = pd.read_csv("C:\\Users\\ujwal\\data\\stonybrook\\spring2020\\visualization\\assignment2\\data.csv")
columns = ['price', 'condition', 'fuel', 'odometer', 'title_status', 'transmission', 'drive', 'size', 'lat', 'long']
data = df[columns]

#data preprocessing
#attributes with order - Label Encoding
data['condition'] = pd.np.where(data.condition.str.contains("like new"), "5",
            pd.np.where(data.condition.str.contains("new"), "6",
            pd.np.where(data.condition.str.contains("excellent"), "4",
            pd.np.where(data.condition.str.contains("good"), "3",
            pd.np.where(data.condition.str.contains("fair"), "2",
            pd.np.where(data.condition.str.contains("salvage"), "1","0"))))))
data['title_status'] = pd.np.where(data.title_status.str.contains("clean"), "4",
            pd.np.where(data.title_status.str.contains("lien"), "3",
            pd.np.where(data.title_status.str.contains("rebuilt"), "2",
            pd.np.where(data.title_status.str.contains("salvage"), "1", "0"))))
data['size'] = pd.np.where(data['size'].str.contains("full-size"), "4",
            pd.np.where(data['size'].str.contains("mid-size"), "3",
            pd.np.where(data['size'].str.contains("sub-compact"), "1",
            pd.np.where(data['size'].str.contains("compact"), "2", "0"))))
#other categorical attributes - One Hot encoding
data['fuel'] = LabelEncoder().fit_transform(data['fuel'])
data['transmission'] = LabelEncoder().fit_transform(data['transmission'])
data['drive'] = LabelEncoder().fit_transform(data['drive'])
labelEncodedOrgData = data.copy()
oneHot_columns = ['fuel', 'transmission', 'drive']
fdata = pd.get_dummies(data, prefix_sep="_", columns=oneHot_columns)
fdata = fdata[fdata.columns]

#converting int and object types to float for uniformity
fdata['price'] = fdata['price'].astype(float)
fdata['condition'] = fdata['condition'].astype(float)
fdata['title_status'] = fdata['title_status'].astype(float)
fdata['size'] = fdata['size'].astype(float)

#scaling all the attributes to the range 0-1
scaler = MinMaxScaler()
scaledData = pd.DataFrame(scaler.fit_transform(fdata), columns=fdata.columns)

#ORIGINAL DataFrame
originalData = scaledData.copy()

#RANDOM SAMPLING
randomSample = scaledData.sample(frac = 0.25)
labelEncodedRandomSampleData = labelEncodedOrgData.iloc[randomSample.index.values, :]

#STRATIFIED SAMPLING
sumOfSquaredDist = []
kRange = range(1,12)
for k in kRange:
    km = KMeans(n_clusters=k)
    km = km.fit(scaledData)
    sumOfSquaredDist.append(km.inertia_)
knee = KneeLocator(kRange, sumOfSquaredDist, curve='convex', direction='decreasing')

kmeans = KMeans(n_clusters = knee.knee)
kmeans = kmeans.fit(scaledData)
scaledData['kvalue'] = kmeans.labels_	#adding labels as additional attribute
count = len(scaledData)/4	#sample size
datacount = math.floor(count/len(scaledData['kvalue'].value_counts()))	#size of each cluster in sample
#new dataframe to save stratified sample and appending records to that dataframe
stratifiedData = pd.DataFrame(columns = scaledData.columns)
for i in scaledData.kvalue.unique():
    temp = scaledData[scaledData['kvalue']==i]
    tempData = temp.sample(n=datacount)
    stratifiedData = stratifiedData.append(tempData)

labelEncodedStratifiedData = labelEncodedOrgData.iloc[stratifiedData.index.values, :]


def performPCA(x, nComponents):
    pca = decomposition.PCA(n_components=nComponents)
    pcs = pca.fit_transform(x)
    pccols=[]
    for i in range(1, nComponents+1):
        pccols.append('PC'+str(i))
    pcdf = pd.DataFrame(data = pcs, columns = pccols)
    return pca, pccols, pcdf

def performMDS(x, dissimilarity):
    embedding = MDS(n_components=2, dissimilarity=dissimilarity)
    if dissimilarity == 'precomputed':
        transformed = embedding.fit_transform(pairwise_distances(x))
    else:
        transformed = embedding.fit_transform(x)
    mdscols = ['MDS1', 'MDS2']
    mdsdf = pd.DataFrame(data = transformed, columns = mdscols)
    print(mdsdf.shape)
    return mdscols, mdsdf

def performPCAForMatrix(x, nComponents):
    pca = decomposition.PCA(n_components=nComponents)
    pcs = pca.fit_transform(pd.DataFrame(scaler.fit_transform(x), columns=x.columns))
    pccols=[]
    for i in range(1,nComponents+1):
        pccols.append('PC'+str(i))
    pcdf = pd.DataFrame(data = pcs, columns = pccols)
    return pca, pccols, pcdf

def top3Attributes(data, pca):
    sumOfSquareLoadings = pd.DataFrame(np.sum(np.square(pd.DataFrame(pca.components_.T * np.sqrt(pca.explained_variance_))), axis = 1))
    largest3 = sumOfSquareLoadings.nlargest(3,0)
    attrVals = data.iloc[:, largest3.index.values]
    return attrVals.columns, attrVals

def createMatrixJSONObj(dframe):
    jsonObj = []
    for i in range(0,3):
        for j in range(2,-1, -1):
            if(i==j):
                col = pd.DataFrame(dframe.iloc[:, [j]].values, columns = ['Same'])
                jsonObj.append(pd.concat([col, dframe.iloc[:, [i]]], axis=1).to_json(orient='records'))
            else:
                jsonObj.append(dframe.iloc[:, [j, i]].to_json(orient='records'))
    return jsonObj;



@app.route("/", methods = ['GET', 'POST'])
def index():
    print(request.method)
    if request.method == 'POST':
        print(request.form['data'])
        if(request.form['data'] == 'scree plot'):
            orgPCA, orgPCCols, orgDf = performPCA(originalData, len(originalData.columns))
            randPCA, randPCCols, randDf = performPCA(randomSample, len(randomSample.columns))
            stratPCA, stratPCColumns, stratDf = performPCA(stratifiedData.iloc[:,:-1], len(stratifiedData.iloc[:,:-1].columns))

            return json.dumps({
            'originalData' : { 'pcaColumns' : orgPCCols, 'explainedVariance' : np.round(orgPCA.explained_variance_ratio_, decimals = 2).tolist() },
            'randomSampleData' : { 'pcaColumns' : randPCCols, 'explainedVariance' : np.round(randPCA.explained_variance_ratio_, decimals = 2).tolist() },
            'stratifiedData' : { 'pcaColumns' : stratPCColumns, 'explainedVariance' : np.round(stratPCA.explained_variance_ratio_, decimals = 2).tolist() }
            })
        elif(request.form['data'] == 'pca scatter plot'):
            print("pca")
            pcorgPCA, pcorgPCCols, pcorgDf = performPCA(originalData, 2)
            pcrandPCA, pcrandPCCols, pcrandDf = performPCA(randomSample, 2)
            pcstratPCA, pcstratPCColumns, pcstratDf = performPCA(stratifiedData.iloc[:,:-1], 2)

            return json.dumps({
            'originalData' : { 'pcaColumns' : pcorgPCCols, 'dataf' : pcorgDf.to_json(orient='records') },
            'randomSampleData' : { 'pcaColumns' : pcrandPCCols, 'dataf' : pcrandDf.to_json(orient='records') },
            'stratifiedData' : { 'pcaColumns' : pcstratPCColumns, 'dataf' : pcstratDf.to_json(orient='records') }
            })

        elif(request.form['data'] == 'mds scatter plot'):
            print("mds")
            eorgCols, eorgMDSDf = performMDS(originalData, 'euclidean')
            erandCols, erandMDSDf = performMDS(randomSample, 'euclidean')
            estratCols, estratMDSDf = performMDS(stratifiedData.iloc[:,:-1], 'euclidean')
            corgCols, corgMDSDf = performMDS(originalData, 'precomputed')
            crandCols, crandMDSDf = performMDS(randomSample, 'precomputed')
            cstratCols, cstratMDSDf = performMDS(stratifiedData.iloc[:,:-1], 'precomputed')

            return json.dumps({
            'eoriginalData' : { 'mdsColumns' : eorgCols, 'mdsDF' : eorgMDSDf.to_json(orient='records') },
            'erandomSampleData' : { 'mdsColumns' : erandCols, 'mdsDF' : erandMDSDf.to_json(orient='records') },
            'estratifiedData' : { 'mdsColumns' : estratCols, 'mdsDF' : estratMDSDf.to_json(orient='records') },
            'coriginalData' : { 'mdsColumns' : corgCols, 'mdsDF' : corgMDSDf.to_json(orient='records') },
            'crandomSampleData' : { 'mdsColumns' : crandCols, 'mdsDF' : crandMDSDf.to_json(orient='records') },
            'cstratifiedData' : { 'mdsColumns' : cstratCols, 'mdsDF' : cstratMDSDf.to_json(orient='records') }
            })

        elif(request.form['data'] == 'scatter matrix'):
            print("matrix")
            orgPCA, orgPCCols, orgDf = performPCAForMatrix(labelEncodedOrgData, 3)
            randPCA, randPCCols, randDf = performPCAForMatrix(labelEncodedRandomSampleData, 3)
            stratPCA, stratPCColumns, stratDf = performPCAForMatrix(labelEncodedStratifiedData.iloc[:,:-1], 3)
            orgCols, orgAttr = top3Attributes(labelEncodedOrgData, orgPCA)
            randCols, randAttr = top3Attributes(labelEncodedRandomSampleData, randPCA)
            stratCols, stratAttr = top3Attributes(labelEncodedStratifiedData.iloc[:,:-1], stratPCA)


            return json.dumps({
            'originalData' : { 'colNames' : orgCols.tolist(), 'attrVals' :  createMatrixJSONObj(orgAttr) },
            'randomSampleData' : { 'colNames' : randCols.tolist(), 'attrVals' : createMatrixJSONObj(randAttr) },
            'stratifiedData' : { 'colNames' : stratCols.tolist(), 'attrVals' : createMatrixJSONObj(stratAttr) }
            })


    else:
        return render_template("index.html", data = data)


	#data = pd.read_csv('data.csv')
	#chart_data = data.to_dict(orient = 'records')
	#chart_data = json.dumps(chart_data, indent = 2)
	#data = {'chart_data': chart_data}
	#print("hello")

	#return render_template("index.html", data = data)

if __name__ == "__main__":
	app.run(debug = True)
