
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Save, Target, Globe } from "lucide-react";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    region: 'australia',
    gci_goal: 0,
    marketing_levy_type: 'percentage',
    marketing_levy_value: 1,
    franchise_fee_type: 'percentage',
    franchise_fee_value: 6,
    transaction_fee_type: 'fixed',
    transaction_fee_value: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadUserSettings = async () => {
      setIsLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);
        setSettings({
          region: userData.region || 'australia',
          gci_goal: userData.gci_goal || 0,
          marketing_levy_type: userData.marketing_levy_type || 'percentage',
          marketing_levy_value: userData.marketing_levy_value || 1,
          franchise_fee_type: userData.franchise_fee_type || 'percentage',
          franchise_fee_value: userData.franchise_fee_value || 6,
          transaction_fee_type: userData.transaction_fee_type || 'fixed',
          transaction_fee_value: userData.transaction_fee_value || 0
        });
      } catch (error) {
        console.error("Failed to load user settings:", error);
      }
      setIsLoading(false);
    };
    loadUserSettings();
  }, []);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await User.updateMyUserData({
        ...settings,
        gci_goal: parseFloat(settings.gci_goal) || 0,
        marketing_levy_value: parseFloat(settings.marketing_levy_value) || 0,
        franchise_fee_value: parseFloat(settings.franchise_fee_value) || 0,
        transaction_fee_value: parseFloat(settings.transaction_fee_value) || 0,
      });
      toast({
        title: "Settings Saved",
        description: "Your default settings have been updated.",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Could not save settings. Please try again.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const regionFinancialYears = {
    australia: "July 1st - June 30th",
    new_zealand: "April 1st - March 31st",
    usa: "October 1st - September 30th",
    uk: "April 6th - April 5th",
    canada: "January 1st - December 31st"
  };

  return (
    <>
      <Toaster />
      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-1">Manage your default application settings.</p>
          </div>

          <div className="grid gap-6">
            <Card className="card-shadow bg-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 gold-accent" />
                  Region & Financial Year
                </CardTitle>
                <CardDescription>
                  Set your region to determine financial year periods and date formats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading settings...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select
                        value={settings.region}
                        onValueChange={(value) => handleInputChange('region', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="australia">Australia</SelectItem>
                          <SelectItem value="new_zealand">New Zealand</SelectItem>
                          <SelectItem value="usa">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="canada">Canada</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Financial Year: {regionFinancialYears[settings.region]}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-shadow bg-white border-0">
              <CardHeader>
                <CardTitle>Default Commission Fees</CardTitle>
                <CardDescription>
                  Set the default fees calculated from the gross commission (ex. GST).
                  These can be overridden for individual properties.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading settings...</p>
                ) : (
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {/* Marketing Levy */}
                      <div className="space-y-2">
                        <Label>Marketing Levy</Label>
                        <div className="flex gap-2">
                          <Select
                            value={settings.marketing_levy_type}
                            onValueChange={(value) => handleInputChange('marketing_levy_type', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="relative flex-grow">
                            <Input
                              type="number"
                              step="0.1"
                              value={settings.marketing_levy_value}
                              onChange={(e) => handleInputChange('marketing_levy_value', e.target.value)}
                              placeholder="Value"
                              className={settings.marketing_levy_type === 'percentage' ? 'pr-7' : 'pl-7'}
                            />
                            <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-500 ${settings.marketing_levy_type === 'percentage' ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
                                {settings.marketing_levy_type === 'percentage' ? '%' : '$'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Franchise Fee */}
                      <div className="space-y-2">
                        <Label>Franchise Fee</Label>
                        <div className="flex gap-2">
                           <Select
                            value={settings.franchise_fee_type}
                            onValueChange={(value) => handleInputChange('franchise_fee_type', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="relative flex-grow">
                            <Input
                              type="number"
                              step="0.1"
                              value={settings.franchise_fee_value}
                              onChange={(e) => handleInputChange('franchise_fee_value', e.target.value)}
                              placeholder="Value"
                              className={settings.franchise_fee_type === 'percentage' ? 'pr-7' : 'pl-7'}
                            />
                            <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-500 ${settings.franchise_fee_type === 'percentage' ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
                                {settings.franchise_fee_type === 'percentage' ? '%' : '$'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Transaction Fee */}
                       <div className="space-y-2">
                        <Label>Transaction Fee</Label>
                        <div className="flex gap-2">
                           <Select
                            value={settings.transaction_fee_type}
                            onValueChange={(value) => handleInputChange('transaction_fee_type', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="relative flex-grow">
                            <Input
                              type="number"
                              step="0.01"
                              value={settings.transaction_fee_value}
                              onChange={(e) => handleInputChange('transaction_fee_value', e.target.value)}
                              placeholder="Value"
                              className={settings.transaction_fee_type === 'percentage' ? 'pr-7' : 'pl-7'}
                            />
                             <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-500 ${settings.transaction_fee_type === 'percentage' ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
                                {settings.transaction_fee_type === 'percentage' ? '%' : '$'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card className="card-shadow bg-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 gold-accent" />
                  Annual Goals
                </CardTitle>
                <CardDescription>
                  Set your annual targets to track your progress throughout the year.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isLoading && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gci_goal">Annual GCI Goal ($)</Label>
                      <Input
                        id="gci_goal"
                        type="number"
                        value={settings.gci_goal}
                        onChange={(e) => handleInputChange('gci_goal', e.target.value)}
                        placeholder="e.g., 500000"
                      />
                      <p className="text-xs text-slate-500">
                        Your target Gross Commission Income (GCI) for the year
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!isLoading && (
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="commission-gradient text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save All Settings'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
