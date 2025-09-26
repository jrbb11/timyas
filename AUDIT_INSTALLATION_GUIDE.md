# 🔧 Audit System Installation Guide

## 🚨 **Issue Identified**

Your Supabase database has the **basic audit system** installed, but your frontend expects the **enhanced audit system**. This is causing the error:

```
column audit_logs.entity does not exist
```

## 🎯 **Solution**

Install the enhanced audit system by running the SQL script in your Supabase database.

## 📋 **Installation Steps**

### **Step 1: Access Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **"New Query"**

### **Step 2: Install Audit System**
1. Copy the entire contents of `for dev/install_audit_system.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the script

### **Step 3: Verify Installation**
After running the script, you should see:
- ✅ Success message: "Audit system installed successfully!"
- ✅ No errors in the SQL Editor

## 🔍 **What This Script Does**

### **1. Removes Old System**
- Drops the basic `audit_logs` table
- Cleans up old triggers and functions

### **2. Creates Enhanced System**
- **audit_logs** table with comprehensive fields
- **security_events** table for security monitoring
- **Audit functions** for logging events
- **Trigger functions** for automatic logging
- **Query functions** for retrieving audit data

### **3. Sets Up Permissions**
- Row Level Security (RLS) policies
- RBAC permissions for audit access
- Function permissions for authenticated users

### **4. Creates Triggers**
Automatic audit logging for:
- Products (create, update, delete)
- Sales (create, update, delete)
- Purchases (create, update, delete)
- People/Customers (create, update, delete)
- User roles (create, update, delete)
- Financial transactions (deposits, expenses, transfers)

## 🎯 **Expected Results**

After installation, you should be able to:

### **✅ Frontend Features**
- View audit trail in the Security Dashboard
- See change history in edit forms
- Access audit logs with proper permissions
- Monitor security events

### **✅ Automatic Logging**
- All data changes are automatically logged
- User actions are tracked
- Security events are monitored
- Complete audit trail is maintained

### **✅ Permissions**
- Owners and Admins can view audit logs
- Proper access control for sensitive data
- Role-based audit access

## 🚨 **Troubleshooting**

### **If you get permission errors:**
```sql
-- Grant additional permissions if needed
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.security_events TO authenticated;
```

### **If triggers don't work:**
```sql
-- Check if triggers exist
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%';
```

### **If functions don't exist:**
```sql
-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%audit%' OR routine_name LIKE '%log%';
```

## 📊 **Testing the Installation**

### **Test 1: Create a Product**
1. Go to Products → Create Product
2. Fill in the form and save
3. Check if audit log is created

### **Test 2: Edit a Sale**
1. Go to Sales → Edit Sale
2. Change the status to "delivered"
3. Check if the change is logged

### **Test 3: View Audit Trail**
1. Go to Security → Audit Trail
2. Verify that logs are visible
3. Check that filters work

## 🔒 **Security Features**

### **Automatic Logging**
- All database changes are logged
- User actions are tracked
- Security events are monitored

### **Access Control**
- Only authorized users can view audit logs
- Role-based permissions
- Row-level security

### **Data Integrity**
- Immutable audit trail
- Complete change history
- User attribution

## 📈 **Performance Considerations**

### **Indexes Created**
- User ID, resource, action, timestamp
- Severity, category for filtering
- Optimized for common queries

### **Efficient Queries**
- Pagination support
- Filtering capabilities
- Date range queries

## 🎯 **Next Steps**

After successful installation:

1. **Test the system** by making some changes
2. **Verify audit logs** are being created
3. **Check permissions** work correctly
4. **Monitor performance** for any issues

## 📞 **Support**

If you encounter any issues:

1. Check the SQL Editor for error messages
2. Verify your user has the correct permissions
3. Ensure all tables exist in your database
4. Check that triggers are properly created

---

**The audit system is now ready to provide comprehensive logging and security monitoring for your Timyas ERP application!** 🎉
