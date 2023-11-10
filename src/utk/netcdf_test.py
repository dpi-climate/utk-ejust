import json
import numpy as np
from netCDF4 import Dataset
import xarray as xr


def test(ncFilePath):
    # ncData = Dataset(ncFilePath)
    # for a in ncData.variables: print(a)


    xrData = xr.open_dataset(ncFilePath)
    print(xrData)
    # for a in xrData.coords: print(a)
    # for a in xrData.attrs: print(a)
    # for a in xrData.variables: print(a)







# ncFile = f'../../examples/wrf_chicago/wrfout_d03_2023-06-09_20_00_00'
ncFile = f'../../examples/wrf_chicago/sresa1b_ncar_ccsm3-example.nc'


test(ncFile)

