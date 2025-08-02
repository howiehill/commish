
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { User } from "@/api/entities";
import { Property } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { X, Upload, FileText, Loader2, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

// A simple CSV parser to handle values with commas wrapped in double quotes.
const parseCSV = (text) => {
  const lines = text.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];

  // Trim headers and remove potential byte order mark
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Regex to split by comma, but not inside quotes
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    if (values.length !== headers.length) continue;

    const entry = {};
    headers.forEach((header, index) => {
      let value = (values[index] || '').trim();
      // Remove quotes from start and end
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      entry[header] = value;
    });
    data.push(entry);
  }
  return data;
}

// Function to strip property ID from address
const stripPropertyId = (address) => {
  if (!address) return "";

  // Pattern to match property IDs like "62P26584, " at the beginning
  // This regex matches:
  // ^               - start of the string
  // [0-9]+          - one or more digits
  // [A-Z]*          - zero or more uppercase letters
  // [0-9]*          - zero or more digits
  // ,               - a literal comma
  // \s*             - zero or more whitespace characters
  const propertyIdPattern = /^[0-9]+[A-Z]*[0-9]*,\s*/;

  // Remove the property ID if it exists
  return address.replace(propertyIdPattern, '').trim();
};

// Region-specific date parsing function
const parseRegionalDate = (dateString, region = 'australia') => {
  if (!dateString || dateString.trim() === '') return new Date().toISOString().split('T')[0];
  
  const trimmed = dateString.trim();
  
  try {
    // Handle different regional date formats
    switch (region) {
      case 'australia':
      case 'uk':
        // DD/MM/YYYY or DD-MM-YYYY format
        const auParts = trimmed.split(/[\/\-]/);
        if (auParts.length === 3) {
          const day = parseInt(auParts[0], 10);
          const month = parseInt(auParts[1], 10) - 1; // JS months are 0-indexed
          const year = parseInt(auParts[2], 10);
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            // Return in YYYY-MM-DD format to avoid timezone issues
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        }
        break;
        
      case 'usa':
      case 'canada':
        // MM/DD/YYYY or MM-DD-YYYY format
        const usParts = trimmed.split(/[\/\-]/);
        if (usParts.length === 3) {
          const month = parseInt(usParts[0], 10) - 1; // JS months are 0-indexed
          const day = parseInt(usParts[1], 10);
          const year = parseInt(usParts[2], 10);
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            // Return in YYYY-MM-DD format to avoid timezone issues
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        }
        break;
        
      case 'new_zealand':
        // DD/MM/YYYY format (same as Australia)
        const nzParts = trimmed.split(/[\/\-]/);
        if (nzParts.length === 3) {
          const day = parseInt(nzParts[0], 10);
          const month = parseInt(nzParts[1], 10) - 1;
          const year = parseInt(nzParts[2], 10);
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            // Return in YYYY-MM-DD format to avoid timezone issues
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        }
        break;
        
      default:
        // Try to parse as ISO date or let Date constructor handle it
        const fallbackDate = new Date(trimmed);
        if (!isNaN(fallbackDate.getTime())) {
          return fallbackDate.toISOString().split('T')[0];
        }
    }
    
    // If all parsing attempts fail, try the browser's Date constructor as last resort
    const lastResortDate = new Date(trimmed);
    if (!isNaN(lastResortDate.getTime())) {
      return lastResortDate.toISOString().split('T')[0];
    }
    
    // If everything fails, return today's date
    return new Date().toISOString().split('T')[0];
    
  } catch (error) {
    console.warn('Date parsing failed:', error);
    return new Date().toISOString().split('T')[0];
  }
};


const processAgentBoxRecord = (record, userSettings) => {
  let address = record['Listing'] || "";

  // Strip the property ID from the address
  address = stripPropertyId(address);

  const salePrice = parseFloat(String(record['Sold Price ($)'] || "0").replace(/[^0-9.-]+/g,"")) || 0;
  const commissionPerc = parseFloat(String(record['Sold Comm (%)'] || "0").replace(/[^0-9.-]+/g,"")) || 2.5;

  // Corrected commission calculation logic
  let gross_commission_ex_gst = parseFloat(String(record['Gross Comm ($) (exGST)'] || "0").replace(/[^0-9.-]+/g,"")) || 0;
  if (gross_commission_ex_gst === 0 && salePrice > 0 && commissionPerc > 0) {
      const calculated_inc_gst = (salePrice * commissionPerc) / 100;
      gross_commission_ex_gst = calculated_inc_gst / 1.1;
  }
  const gross_commission_inc_gst = gross_commission_ex_gst * 1.1;

  const netToAgent = parseFloat(String(record['Net to Agent ($)'] || "0").replace(/[^0-9.-]+/g,"")) || 0;

  // New direct import fields. Fallback to 0 if per-agent value is not a number.
  const gross_commission_per_agent = parseFloat(String(record['Gross Comm / Agent ($) (exGST)'] || '0').replace(/[^0-9.-]+/g, "")) || 0;
  const sale_price_per_agent = parseFloat(String(record['Sale / Agent'] || '0').replace(/[^0-9.-]+/g, "")) || salePrice;

  const currentStatus = record['Current Status'] || "settled";
  const statusMap = {
    'settled': 'settled', 'sold': 'settled', 'unconditional': 'settled',
    'conditional': 'conditional', 'pending': 'pending'
  };
  const status = statusMap[currentStatus.toLowerCase()] || 'settled';

  const propType = record['Property Type'] || "house";
  const typeMap = {
    'house': 'house', 'apartment': 'apartment', 'unit': 'apartment',
    'townhouse': 'townhouse', 'villa': 'townhouse', 'land': 'land', 'commercial': 'commercial'
  };
  let propertyType = typeMap[propType.toLowerCase()] || 'house';

  // If the address contains a slash, override the property type to 'apartment'
  if (address.includes('/')) {
    propertyType = 'apartment';
  }

  const marketing_levy = gross_commission_ex_gst * ((userSettings.marketing_levy_value || 1) / 100);
  const franchise_fee = gross_commission_ex_gst * ((userSettings.franchise_fee_value || 6) / 100);

  // CORRECTED: Directly use the value from the "Net to Agent ($)" column without a fallback.
  const net_commission = netToAgent;

  // Parse settlement date according to user's region
  const userRegion = userSettings.region || 'australia';
  const settlementDate = parseRegionalDate(record['Unconditional Date'] || "", userRegion);

  const date = new Date(settlementDate); // This will be a local date
  const year = date.getFullYear();
  // Financial year logic: if month is July (6) or later, it's current year-next year; else, previous year-current year
  const financial_year = date.getMonth() >= 6 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;


  return {
    address, sale_price: salePrice, commission_percentage: commissionPerc, gst_inclusive: true,
    gross_commission_inc_gst, gross_commission_ex_gst, marketing_levy,
    marketing_levy_type: userSettings.marketing_levy_type || 'percentage',
    marketing_levy_value: userSettings.marketing_levy_value || 1,
    franchise_fee, franchise_fee_type: userSettings.franchise_fee_type || 'percentage',
    franchise_fee_value: userSettings.franchise_fee_value || 6,
    transaction_fee: 0, transaction_fee_type: userSettings.transaction_fee_type || 'fixed',
    transaction_fee_value: userSettings.transaction_fee_value || 0,
    other_fees: 0, 
    net_commission, // This now uses the corrected value
    settlement_date: settlementDate, 
    financial_year,
    status, 
    client_name: record['Agent'] || "", 
    property_type: propertyType,
    gross_commission_per_agent, 
    sale_price_per_agent,
    agent_count: 1 // Default to 1, as CSV doesn't specify. The per-agent values are now direct.
  };
};

export default function ImportCSVModal({ onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [duplicateData, setDuplicateData] = useState(null);
  const [showDuplicateOptions, setShowDuplicateOptions] = useState(false);

  // Add retry logic for API calls
  const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        // Check if it's an Axios error with response status 429
        if (error.response?.status === 429 && attempt < maxRetries) {
          console.log(`Rate limited, retrying in ${delay * attempt}ms... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        throw error;
      }
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus('idle');
    setMessage('');
    setShowDuplicateOptions(false);
    setDuplicateData(null);
  };

  const checkForDuplicates = async (processedData) => {
    setStatus('checking');
    setMessage('Checking for duplicate records...');

    try {
      const existingProperties = await retryApiCall(() => Property.list()); // Assuming Property.list() fetches all existing properties
      const duplicates = [];
      const newRecords = [];

      processedData.forEach(newRecord => {
        const duplicate = existingProperties.find(existing =>
          existing.address?.toLowerCase().trim() === newRecord.address?.toLowerCase().trim() &&
          existing.settlement_date === newRecord.settlement_date &&
          Math.abs(existing.sale_price - newRecord.sale_price) < 1 // Allow for small rounding differences
        );

        if (duplicate) {
          duplicates.push({
            existing: duplicate,
            new: newRecord
          });
        } else {
          newRecords.push(newRecord);
        }
      });

      return { duplicates, newRecords };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      throw new Error('Failed to check for duplicate records');
    }
  };

  const handleImport = async (skipDuplicateCheck = false) => {
    if (!file) {
      toast({ title: "No file selected", description: "Please choose a CSV file to import.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setStatus('extracting');
    setMessage('Reading CSV data...');

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const csvText = e.target.result;
        const csvRows = parseCSV(csvText);

        if (csvRows.length === 0) throw new Error("The CSV file appears to be empty or in an invalid format.");

        const validRows = csvRows.filter(row => {
          const listing = (row['Listing'] || "").trim().toLowerCase();
          // Exclude summary rows like 'Total' or 'Average'
          if (listing.startsWith('total') || listing.startsWith('average')) {
            return false;
          }
          // Ensure the row has a listing and a sale price
          return (row['Listing'] || "").trim() !== "" && (row['Sold Price ($)'] || "0") !== "0";
        });

        if (validRows.length === 0) throw new Error("No valid property records found in the CSV. Please ensure it contains 'Listing' and 'Sold Price ($)' columns and is not just summary rows.");

        const userSettings = await retryApiCall(() => User.me());
        const processedData = validRows.map(row => processAgentBoxRecord(row, userSettings));

        if (!skipDuplicateCheck) {
          const { duplicates, newRecords } = await checkForDuplicates(processedData);

          if (duplicates.length > 0) {
            setDuplicateData({ duplicates, newRecords, allProcessedData: processedData }); // allProcessedData is important for 'replace all'
            setShowDuplicateOptions(true);
            setStatus('duplicates_found');
            setMessage(`Found ${duplicates.length} duplicate records. Choose how to proceed.`);
            setIsProcessing(false); // Stop processing and wait for user action
            return;
          }
        }

        // If we reach here, it means no duplicates were found on initial check
        // OR skipDuplicateCheck was true (e.g., from handleReplaceAll)
        setStatus('saving');
        setMessage(`Processing and saving ${processedData.length} properties...`);

        await retryApiCall(() => Property.bulkCreate(processedData)); // This will create all properties from the CSV

        setStatus('success');
        setMessage(`${processedData.length} properties imported successfully!`);
        toast({ title: "Import Successful", description: `Added ${processedData.length} properties.`, variant: "success" });
        setTimeout(onImportSuccess, 1500);

      } catch (error) {
        setStatus('error');
        setMessage(error.message || "An unknown error occurred during import.");
        toast({ title: "Import Failed", description: error.message, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setStatus('error');
      setMessage("Failed to read the file.");
      toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleReplaceAll = async () => {
    if (!duplicateData) return;

    setIsProcessing(true);
    setStatus('replacing');
    setMessage('Replacing existing records with new data...');

    try {
      // Delete existing duplicates
      for (const duplicate of duplicateData.duplicates) {
        await retryApiCall(() => Property.delete(duplicate.existing.id));
      }

      // Import all new data (this includes what were duplicates, now replaced)
      await retryApiCall(() => Property.bulkCreate(duplicateData.allProcessedData));

      setStatus('success');
      setMessage(`Successfully replaced ${duplicateData.duplicates.length} records and added ${duplicateData.newRecords.length} new records!`);
      toast({
        title: "Import Successful",
        description: `Replaced ${duplicateData.duplicates.length} existing records and added ${duplicateData.newRecords.length} new records.`,
        variant: "success"
      });
      setTimeout(onImportSuccess, 1500);

    } catch (error) {
      setStatus('error');
      setMessage(error.message || "An error occurred while replacing records.");
      toast({ title: "Replace Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipDuplicates = async () => {
    if (!duplicateData) return;

    setIsProcessing(true);
    setStatus('saving');
    setMessage(`Importing ${duplicateData.newRecords.length} new records (skipping duplicates)...`);

    try {
      if (duplicateData.newRecords.length > 0) {
        await retryApiCall(() => Property.bulkCreate(duplicateData.newRecords));
      }

      setStatus('success');
      setMessage(`Successfully imported ${duplicateData.newRecords.length} new records (skipping ${duplicateData.duplicates.length} duplicates)!`);
      toast({
        title: "Import Successful",
        description: `Added ${duplicateData.newRecords.length} new records, skipped ${duplicateData.duplicates.length} duplicates.`,
        variant: "success"
      });
      setTimeout(onImportSuccess, 1500);

    } catch (error) {
      setStatus('error');
      setMessage(error.message || "An error occurred while importing new records.");
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const statusIcons = {
    idle: <FileText className="w-12 h-12 text-slate-400" />,
    extracting: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />,
    checking: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />,
    duplicates_found: <AlertCircle className="w-12 h-12 text-orange-500" />,
    saving: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />,
    replacing: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />,
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
    error: <AlertTriangle className="w-12 h-12 text-red-500" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <Toaster />
      <Card className="bg-white max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Import from AgentBox CSV</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <CardDescription>
            Upload your AgentBox CSV export. The system will automatically detect duplicates and let you choose how to handle them.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-lg">
              {statusIcons[status]}
              {message && <p className="mt-4 text-sm text-slate-600 font-medium">{message}</p>}
            </div>

            {!showDuplicateOptions && (
              <>
                <div className="space-y-2">
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-slate-500">
                    Selected file: {file ? file.name : 'None'}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Expected AgentBox Columns:</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• Listing (property address)</p>
                    <p>• Sold Price ($)</p>
                    <p>• Sold Comm (%)</p>
                    <p>• Gross Comm ($) (exGST)</p>
                    <p>• <span className="font-bold">Gross Comm / Agent ($) (exGST)</span> (New)</p>
                    <p>• <span className="font-bold">Sale / Agent</span> (New)</p>
                    <p>• Unconditional Date</p>
                    <p>• Current Status</p>
                    <p>• Net to Agent ($)</p>
                  </div>
                </div>
              </>
            )}

            {showDuplicateOptions && (
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">⚠️ Duplicate Records Detected</h4>
                  <p className="text-sm text-orange-800 mb-3">
                    Found {duplicateData?.duplicates.length} duplicate properties and {duplicateData?.newRecords.length} new records.
                  </p>
                  <div className="text-xs text-orange-700 space-y-1">
                    <p><strong>Duplicates are matched by:</strong> Address + Settlement Date + Sale Price</p>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-900 mb-2">⚠️ Data Loss Warning</h4>
                  <p className="text-xs text-red-700">
                    <strong>Replace All:</strong> Will permanently delete existing records and replace them with new data. This action cannot be undone.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleReplaceAll}
                    disabled={isProcessing}
                    variant="destructive"
                    className="w-full"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Replace All Records (Destructive)
                  </Button>

                  <Button
                    onClick={handleSkipDuplicates}
                    disabled={isProcessing}
                    className="commission-gradient text-white w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Skip Duplicates (Safe)
                  </Button>

                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel Import
                  </Button>
                </div>
              </div>
            )}

            {!showDuplicateOptions && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleImport()}
                  disabled={!file || isProcessing}
                  className="commission-gradient text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import from AgentBox
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
