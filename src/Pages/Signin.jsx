import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../index.css";


function Signin() {

  const navigate = useNavigate();


  const [formData,setFormData] = useState({

    firstname:"",
    middlename:"",
    lastname:"",
    email:"",
    phone:"",
    password:"",
    confirmPassword:"",
    role:"patient"

  });



  const [errors,setErrors] = useState({});

  const [successMessage,setSuccessMessage] = useState("");



  useEffect(()=>{

    const localData =
    localStorage.getItem("signinData");


    const sessionData =
    sessionStorage.getItem("signinData");


    if(localData){

      setFormData(JSON.parse(localData));

    }
    else if(sessionData){

      setFormData(JSON.parse(sessionData));

    }


  },[]);





  const handleChange=(e)=>{

    const {name,value}=e.target;


    setFormData(prev=>({

      ...prev,

      [name]:value

    }));

  };






  const handleSubmit=async(e)=>{


    e.preventDefault();



    let newErrors={};



    const namePattern=/^[A-Za-z ]{2,20}$/;

    const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phonePattern=/^[0-9]{10}$/;

    const passwordPattern=/^(?=.*[A-Z])(?=.*[0-9]).{6,}$/;





    if(!formData.firstname){

      newErrors.firstname="First Name required";

    }
    else if(!namePattern.test(formData.firstname)){

      newErrors.firstname="Invalid First Name";

    }






    if(!formData.lastname){

      newErrors.lastname="Last Name required";

    }
    else if(!namePattern.test(formData.lastname)){

      newErrors.lastname="Invalid Last Name";

    }







    if(!formData.email){

      newErrors.email="Email required";

    }
    else if(!emailPattern.test(formData.email)){

      newErrors.email="Enter valid email";

    }







    if(!formData.phone){

      newErrors.phone="Phone required";

    }
    else if(!phonePattern.test(formData.phone)){

      newErrors.phone="Enter 10 digit phone number";

    }






    if(!formData.password){

      newErrors.password="Password required";

    }
    else if(!passwordPattern.test(formData.password)){


      newErrors.password =
      "1 uppercase, 1 number and minimum 6 characters";

    }







    if(!formData.confirmPassword){


      newErrors.confirmPassword =
      "Confirm password required";

    }
    else if(
      formData.password !== formData.confirmPassword
    ){

      newErrors.confirmPassword =
      "Passwords do not match";

    }





    setErrors(newErrors);





    if(Object.keys(newErrors).length===0){



      const userData={


        firstname:formData.firstname,

        middlename:formData.middlename,

        lastname:formData.lastname,

        email:formData.email,

        phone:formData.phone,

        password:formData.password,

        role:formData.role


      };



      try{


        const response = await axios.post(

          "https://medcare-hms-backend.onrender.com/api/user/signup",

          userData

        );



        alert(response.data.message);



        // backup only
        localStorage.setItem(
          "signinData",
          JSON.stringify(userData)
        );


        sessionStorage.setItem(
          "signinData",
          JSON.stringify(userData)
        );



        setSuccessMessage(
          "Signup Successful... Redirecting to Login..."
        );



        setTimeout(()=>{

          navigate("/login");

        },1500);



      }


      catch(error){


        alert(

          error.response?.data?.message ||

          "Signup Failed"

        );


      }



    }



  };









return (

<div className="login-page-wrapper">

<div className="container">



<div className="logo-image">

  <div className="logo-badge">

    <img
    src="/logo.png"
    alt="MedCare Logo"
    />

    <h1>
    MedCare
    </h1>

  </div>


  <p className="tagline">
    Create Your Account
  </p>


</div>







<div className="input">


<label>
Select Role
</label>



<select

name="role"

value={formData.role}

onChange={handleChange}

>


<option value="patient">
Patient
</option>


<option value="doctor">
Doctor
</option>


<option value="labstaff">
Lab Staff
</option>

<option value="pharmacystaff">
Pharmacy Staff
</option>


</select>



</div>










<div className="login-form">


<form onSubmit={handleSubmit}>


<input

type="text"

name="firstname"

placeholder="First Name"

value={formData.firstname}

onChange={handleChange}

/>


<div className="error">
{errors.firstname}
</div>





<input

type="text"

name="middlename"

placeholder="Middle Name"

value={formData.middlename}

onChange={handleChange}

/>






<input

type="text"

name="lastname"

placeholder="Last Name"

value={formData.lastname}

onChange={handleChange}

/>


<div className="error">
{errors.lastname}
</div>








<input

type="email"

name="email"

placeholder="Email"

value={formData.email}

onChange={handleChange}

/>


<div className="error">
{errors.email}
</div>







<input

type="tel"

name="phone"

placeholder="Phone Number"

value={formData.phone}

onChange={handleChange}

/>


<div className="error">
{errors.phone}
</div>







<input

type="password"

name="password"

placeholder="Create Password"

value={formData.password}

onChange={handleChange}

/>


<div className="error">
{errors.password}
</div>







<input

type="password"

name="confirmPassword"

placeholder="Confirm Password"

value={formData.confirmPassword}

onChange={handleChange}

/>


<div className="error">

{errors.confirmPassword}

</div>








<input

type="submit"

value="Signup"

/>



</form>



</div>








<div className="signup-link">


<p>

Already have an account?


{" "}


<Link to="/login">

Login

</Link>


</p>


</div>







<div className="success">

{successMessage}

</div>




</div>

</div>


);


}


export default Signin;